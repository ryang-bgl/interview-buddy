import * as path from "node:path";
import {
  Stack,
  StackProps,
  Duration,
  RemovalPolicy,
  CfnOutput,
  CfnParameter,
  Tags,
  Fn,
  CfnCondition,
} from "aws-cdk-lib";
import { Construct } from "constructs";
import {
  AttributeType,
  BillingMode,
  ProjectionType,
  Table,
  StreamViewType,
} from "aws-cdk-lib/aws-dynamodb";
import { Runtime, StartingPosition } from "aws-cdk-lib/aws-lambda";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import { DynamoEventSource } from "aws-cdk-lib/aws-lambda-event-sources";
import {
  HttpApi,
  HttpMethod,
  CorsHttpMethod,
  CorsPreflightOptions,
  WebSocketApi,
  WebSocketStage,
  DomainName,
  ApiMapping,
  CfnDomainName,
  CfnApiMapping,
} from "aws-cdk-lib/aws-apigatewayv2";
import {
  HttpLambdaIntegration,
  WebSocketLambdaIntegration,
} from "aws-cdk-lib/aws-apigatewayv2-integrations";
import { Certificate } from "aws-cdk-lib/aws-certificatemanager";

export interface InterviewBuddyApiStackProps extends StackProps {
  stage: string;
}

export class InterviewBuddyApiStack extends Stack {
  constructor(
    scope: Construct,
    id: string,
    props: InterviewBuddyApiStackProps
  ) {
    super(scope, id, props);

    const stage = props.stage ?? "dev";
    const stageSuffix = stage.toLowerCase();

    const supabaseJwtAudience = new CfnParameter(this, "SupabaseJwtAudience", {
      type: "String",
      description: "Expected JWT audience from Supabase tokens.",
      default: "authenticated",
    });

    const supabaseAuthUrlParam = new CfnParameter(this, "SupabaseAuthUrl", {
      type: "String",
      description:
        "Supabase auth base URL (e.g., https://project.supabase.co/auth/v1)",
      default: process.env.SUPABASE_AUTH_URL ?? process.env.AUTH_HOST ?? "",
    });

    const supabaseJwksUrlParam = new CfnParameter(this, "SupabaseJwksUrl", {
      type: "String",
      description:
        "Supabase JWKS endpoint (e.g., https://project.supabase.co/auth/v1/.well-known/jwks.json)",
      default: process.env.SUPABASE_JWKS_URL ?? process.env.AUTH_JWKS_URL ?? "",
    });

    const supabaseIssuerParam = new CfnParameter(this, "SupabaseJwtIssuer", {
      type: "String",
      description: "Supabase JWT issuer (iss claim)",
      default:
        process.env.JWT_ISSUER ??
        process.env.SUPABASE_AUTH_URL ??
        process.env.AUTH_HOST ??
        "",
    });

    const deepseekApiKey = new CfnParameter(this, "DeepseekApiKey", {
      type: "String",
      description: "API key for DeepSeek chat completions.",
      noEcho: true,
    });

    const deepseekApiUrl = new CfnParameter(this, "DeepseekApiUrl", {
      type: "String",
      description: "DeepSeek chat completions endpoint.",
      default: "https://api.deepseek.com/chat/completions",
    });

    const deepseekModel = new CfnParameter(this, "DeepseekModel", {
      type: "String",
      description: "Model identifier to request from DeepSeek.",
      default: "deepseek-chat",
    });

    const apiCustomDomainArn = new CfnParameter(this, "HttpApiCertificateArn", {
      type: "String",
      description:
        "(Optional) ACM certificate ARN for the HTTP API custom domain (us-east-1)",
      default: process.env.HTTP_API_CERTIFICATE_ARN ?? "",
    });

    const apiHost = new CfnParameter(this, "ApiHost", {
      type: "String",
      description: "(Optional) Custom domain host name bound to the HTTP API",
      default: process.env.HTTP_API_HOST ?? "",
    });

    const supabaseAuthUrl = supabaseAuthUrlParam.valueAsString;
    const supabaseJwksUrl = supabaseJwksUrlParam.valueAsString;
    const supabaseJwtIssuer = supabaseIssuerParam.valueAsString;

    const userIdIndexName = "id-index";
    const usersTable = new Table(this, "UsersTable", {
      tableName: `interview-buddy-users-${stageSuffix}`,
      partitionKey: { name: "email", type: AttributeType.STRING },
      billingMode: BillingMode.PAY_PER_REQUEST,
      removalPolicy: RemovalPolicy.DESTROY,
    });

    usersTable.addGlobalSecondaryIndex({
      indexName: userIdIndexName,
      partitionKey: { name: "id", type: AttributeType.STRING },
      projectionType: ProjectionType.ALL,
    });

    const userDsaTable = new Table(this, "UserDsaQuestionsTable", {
      tableName: `interview-buddy-user-dsa-questions-${stageSuffix}`,
      partitionKey: { name: "userId", type: AttributeType.STRING },
      sortKey: { name: "questionIndex", type: AttributeType.STRING },
      billingMode: BillingMode.PAY_PER_REQUEST,
      removalPolicy: RemovalPolicy.DESTROY,
    });

    const userNotesTable = new Table(this, "UserNotesTable", {
      tableName: `interview-buddy-user-notes-${stageSuffix}`,
      partitionKey: { name: "userId", type: AttributeType.STRING },
      sortKey: { name: "noteId", type: AttributeType.STRING },
      billingMode: BillingMode.PAY_PER_REQUEST,
      removalPolicy: RemovalPolicy.DESTROY,
    });

    const generalNoteJobsTable = new Table(this, "GeneralNoteJobsTable", {
      tableName: `interview-buddy-general-note-jobs-${stageSuffix}`,
      partitionKey: { name: "jobId", type: AttributeType.STRING },
      billingMode: BillingMode.PAY_PER_REQUEST,
      removalPolicy: RemovalPolicy.DESTROY,
      stream: StreamViewType.NEW_IMAGE,
      timeToLiveAttribute: "expiresAt",
    });

    const aiSolutionTable = new Table(this, "AiSolutionTable", {
      tableName: `interview-buddy-ai-solutions-${stageSuffix}`,
      partitionKey: { name: "questionIndex", type: AttributeType.STRING },
      sortKey: { name: "language", type: AttributeType.STRING },
      billingMode: BillingMode.PAY_PER_REQUEST,
      removalPolicy: RemovalPolicy.DESTROY,
    });

    const userFeedbackTable = new Table(this, "UserFeedbackTable", {
      tableName: `interview-buddy-user-feedback-${stageSuffix}`,
      partitionKey: { name: "userId", type: AttributeType.STRING },
      sortKey: { name: "feedbackId", type: AttributeType.STRING },
      billingMode: BillingMode.PAY_PER_REQUEST,
      removalPolicy: RemovalPolicy.DESTROY,
    });

    const commonLambdaEnv = {
      STAGE: stage,
      USERS_TABLE_NAME: usersTable.tableName,
      USERS_TABLE_ID_INDEX_NAME: userIdIndexName,
      SUPABASE_AUTH_URL: supabaseAuthUrl,
      SUPABASE_JWKS_URL: supabaseJwksUrl,
      SUPABASE_JWT_AUDIENCE: supabaseJwtAudience.valueAsString,
      JWT_ISSUER: supabaseJwtIssuer,
    } as const;

    const defaultLambdaProps = {
      runtime: Runtime.NODEJS_24_X,
      memorySize: 256,
      timeout: Duration.seconds(15),
      bundling: {
        target: "es2020",
        minify: true,
        sourceMap: true,
      },
    } as const;

    const createUserQuestionFn = new NodejsFunction(
      this,
      "CreateUserQuestionFunction",
      {
        ...defaultLambdaProps,
        entry: path.join(
          __dirname,
          "..",
          "src",
          "functions",
          "dsa",
          "createUserQuestion.ts"
        ),
        handler: "handler",
        environment: {
          ...commonLambdaEnv,
          USER_DSA_TABLE_NAME: userDsaTable.tableName,
        },
      }
    );

    const getUserQuestionsFn = new NodejsFunction(
      this,
      "GetUserQuestionsFunction",
      {
        ...defaultLambdaProps,
        entry: path.join(
          __dirname,
          "..",
          "src",
          "functions",
          "dsa",
          "getUserQuestions.ts"
        ),
        handler: "handler",
        environment: {
          ...commonLambdaEnv,
          USER_DSA_TABLE_NAME: userDsaTable.tableName,
        },
      }
    );

    const updateQuestionReviewFn = new NodejsFunction(
      this,
      "UpdateQuestionReviewFunction",
      {
        ...defaultLambdaProps,
        entry: path.join(
          __dirname,
          "..",
          "src",
          "functions",
          "dsa",
          "updateQuestionReview.ts"
        ),
        handler: "handler",
        environment: {
          ...commonLambdaEnv,
          USER_DSA_TABLE_NAME: userDsaTable.tableName,
        },
      }
    );

    const createFeedbackFn = new NodejsFunction(this, "CreateFeedbackFunction", {
      ...defaultLambdaProps,
      entry: path.join(
        __dirname,
        "..",
        "src",
        "functions",
        "feedback",
        "createFeedback.ts"
      ),
      handler: "handler",
      environment: {
        ...commonLambdaEnv,
        USER_FEEDBACK_TABLE_NAME: userFeedbackTable.tableName,
      },
    });

    const generateAiSolutionFn = new NodejsFunction(
      this,
      "GenerateAiSolutionFunction",
      {
        ...defaultLambdaProps,
        timeout: Duration.seconds(30),
        entry: path.join(
          __dirname,
          "..",
          "src",
          "functions",
          "dsa",
          "generateAiSolution.ts"
        ),
        handler: "handler",
        environment: {
          ...commonLambdaEnv,
          USER_DSA_TABLE_NAME: userDsaTable.tableName,
          AI_SOLUTION_TABLE_NAME: aiSolutionTable.tableName,
          DEEPSEEK_API_KEY: deepseekApiKey.valueAsString,
          DEEPSEEK_API_URL: deepseekApiUrl.valueAsString,
          DEEPSEEK_MODEL: deepseekModel.valueAsString,
        },
      }
    );

    const generalNoteJobProcessorFn = new NodejsFunction(
      this,
      "ProcessGeneralNoteJobFunction",
      {
        ...defaultLambdaProps,
        timeout: Duration.minutes(10),
        entry: path.join(
          __dirname,
          "..",
          "src",
          "functions",
          "notes",
          "processGeneralNoteJob.ts"
        ),
        handler: "handler",
        environment: {
          GENERAL_NOTE_JOBS_TABLE_NAME: generalNoteJobsTable.tableName,
          USER_NOTES_TABLE_NAME: userNotesTable.tableName,
          DEEPSEEK_API_KEY: deepseekApiKey.valueAsString,
          DEEPSEEK_API_URL: deepseekApiUrl.valueAsString,
          DEEPSEEK_MODEL: deepseekModel.valueAsString,
        },
      }
    );
    generalNoteJobProcessorFn.addEventSource(
      new DynamoEventSource(generalNoteJobsTable, {
        startingPosition: StartingPosition.TRIM_HORIZON,
        retryAttempts: 2,
        batchSize: 1,
      })
    );

    const generalNoteJobRequestFn = new NodejsFunction(
      this,
      "RequestGeneralNoteJobFunction",
      {
        ...defaultLambdaProps,
        entry: path.join(
          __dirname,
          "..",
          "src",
          "functions",
          "notes",
          "requestGeneralNoteJob.ts"
        ),
        handler: "handler",
        environment: {
          ...commonLambdaEnv,
          GENERAL_NOTE_JOBS_TABLE_NAME: generalNoteJobsTable.tableName,
          GENERAL_NOTE_MAX_CONTENT: "8000",
        },
      }
    );

    const getGeneralNoteJobFn = new NodejsFunction(
      this,
      "GetGeneralNoteJobFunction",
      {
        ...defaultLambdaProps,
        entry: path.join(
          __dirname,
          "..",
          "src",
          "functions",
          "notes",
          "getGeneralNoteJob.ts"
        ),
        handler: "handler",
        environment: {
          ...commonLambdaEnv,
          GENERAL_NOTE_JOBS_TABLE_NAME: generalNoteJobsTable.tableName,
        },
      }
    );

    const getGeneralNoteByUrlFn = new NodejsFunction(
      this,
      "GetGeneralNoteByUrlFunction",
      {
        ...defaultLambdaProps,
        entry: path.join(
          __dirname,
          "..",
          "src",
          "functions",
          "notes",
          "getGeneralNoteByUrl.ts"
        ),
        handler: "handler",
        environment: {
          ...commonLambdaEnv,
          USER_NOTES_TABLE_NAME: userNotesTable.tableName,
        },
      }
    );

    const listGeneralNotesFn = new NodejsFunction(
      this,
      "ListGeneralNotesFunction",
      {
        ...defaultLambdaProps,
        entry: path.join(
          __dirname,
          "..",
          "src",
          "functions",
          "notes",
          "listGeneralNotes.ts"
        ),
        handler: "handler",
        environment: {
          ...commonLambdaEnv,
          USER_NOTES_TABLE_NAME: userNotesTable.tableName,
        },
      }
    );

    const updateNoteReviewFn = new NodejsFunction(
      this,
      "UpdateNoteReviewFunction",
      {
        ...defaultLambdaProps,
        entry: path.join(
          __dirname,
          "..",
          "src",
          "functions",
          "notes",
          "updateNoteReview.ts"
        ),
        handler: "handler",
        environment: {
          USER_NOTES_TABLE_NAME: userNotesTable.tableName,
          ...commonLambdaEnv,
        },
      }
    );

    const addGeneralNoteCardFn = new NodejsFunction(
      this,
      "AddGeneralNoteCardFunction",
      {
        ...defaultLambdaProps,
        entry: path.join(
          __dirname,
          "..",
          "src",
          "functions",
          "notes",
          "addGeneralNoteCard.ts"
        ),
        handler: "handler",
        environment: {
          ...commonLambdaEnv,
          USER_NOTES_TABLE_NAME: userNotesTable.tableName,
        },
      }
    );

    const deleteGeneralNoteCardFn = new NodejsFunction(
      this,
      "DeleteGeneralNoteCardFunction",
      {
        ...defaultLambdaProps,
        entry: path.join(
          __dirname,
          "..",
          "src",
          "functions",
          "notes",
          "deleteGeneralNoteCard.ts"
        ),
        handler: "handler",
        environment: {
          ...commonLambdaEnv,
          USER_NOTES_TABLE_NAME: userNotesTable.tableName,
        },
      }
    );

    const authByApiKeyFn = new NodejsFunction(this, "AuthByApiKeyFunction", {
      ...defaultLambdaProps,
      entry: path.join(
        __dirname,
        "..",
        "src",
        "functions",
        "auth",
        "authByApiKey.ts"
      ),
      handler: "handler",
      environment: commonLambdaEnv,
    });

    const currentPrincipalFn = new NodejsFunction(
      this,
      "CurrentPrincipalFunction",
      {
        ...defaultLambdaProps,
        entry: path.join(
          __dirname,
          "..",
          "src",
          "functions",
          "auth",
          "currentPrincipal.ts"
        ),
        handler: "handler",
        environment: commonLambdaEnv,
      }
    );

    const getCurrentUserFn = new NodejsFunction(
      this,
      "GetCurrentUserFunction",
      {
        ...defaultLambdaProps,
        entry: path.join(
          __dirname,
          "..",
          "src",
          "functions",
          "user",
          "getCurrentUser.ts"
        ),
        handler: "handler",
        environment: commonLambdaEnv,
      }
    );

    userDsaTable.grantReadWriteData(createUserQuestionFn);
    userDsaTable.grantReadData(getUserQuestionsFn);
    userDsaTable.grantReadWriteData(updateQuestionReviewFn);
    usersTable.grantReadData(updateQuestionReviewFn);
    usersTable.grantReadWriteData(createUserQuestionFn);
    usersTable.grantReadData(getUserQuestionsFn);
    usersTable.grantReadWriteData(authByApiKeyFn);
    usersTable.grantReadWriteData(currentPrincipalFn);
    usersTable.grantReadWriteData(getCurrentUserFn);
    usersTable.grantReadWriteData(generalNoteJobRequestFn);
    usersTable.grantReadWriteData(getGeneralNoteJobFn);
    usersTable.grantReadWriteData(getGeneralNoteByUrlFn);
    usersTable.grantReadWriteData(listGeneralNotesFn);
    usersTable.grantReadData(addGeneralNoteCardFn);
    usersTable.grantReadData(deleteGeneralNoteCardFn);
    usersTable.grantReadData(generateAiSolutionFn);
    userNotesTable.grantReadWriteData(generalNoteJobProcessorFn);
    userNotesTable.grantReadData(getGeneralNoteByUrlFn);
    userNotesTable.grantReadData(listGeneralNotesFn);
    userNotesTable.grantReadWriteData(addGeneralNoteCardFn);
    userNotesTable.grantReadWriteData(deleteGeneralNoteCardFn);
    userNotesTable.grantReadWriteData(updateNoteReviewFn);
    userFeedbackTable.grantReadWriteData(createFeedbackFn);
    generalNoteJobsTable.grantReadWriteData(generalNoteJobRequestFn);
    generalNoteJobsTable.grantReadWriteData(generalNoteJobProcessorFn);
    generalNoteJobsTable.grantReadData(getGeneralNoteJobFn);
    userDsaTable.grantReadData(generateAiSolutionFn);
    aiSolutionTable.grantReadWriteData(generateAiSolutionFn);

    const cors: CorsPreflightOptions = {
      allowHeaders: ["Content-Type", "x-api-key", "authorization"],
      allowMethods: [CorsHttpMethod.ANY],
      allowOrigins: ["*"],
      maxAge: Duration.days(10),
    };

    const httpApi = new HttpApi(this, "InterviewBuddyHttpApi", {
      apiName: `interview-buddy-api-${stageSuffix}`,
      corsPreflight: cors,
    });

    httpApi.addRoutes({
      path: "/api/dsa/questions",
      methods: [HttpMethod.POST],
      integration: new HttpLambdaIntegration(
        "CreateUserQuestionIntegration",
        createUserQuestionFn
      ),
    });

    httpApi.addRoutes({
      path: "/api/dsa/questions",
      methods: [HttpMethod.GET],
      integration: new HttpLambdaIntegration(
        "GetUserQuestionsIntegration",
        getUserQuestionsFn
      ),
    });

    httpApi.addRoutes({
      path: "/api/dsa/questions/{questionIndex}/review",
      methods: [HttpMethod.PATCH],
      integration: new HttpLambdaIntegration(
        "UpdateQuestionReviewIntegration",
        updateQuestionReviewFn
      ),
    });

    httpApi.addRoutes({
      path: "/api/feedback",
      methods: [HttpMethod.POST],
      integration: new HttpLambdaIntegration(
        "CreateFeedbackIntegration",
        createFeedbackFn
      ),
    });

    httpApi.addRoutes({
      path: "/api/auth-by-api-key",
      methods: [HttpMethod.POST],
      integration: new HttpLambdaIntegration(
        "AuthByApiKeyIntegration",
        authByApiKeyFn
      ),
    });

    httpApi.addRoutes({
      path: "/api/current-principal",
      methods: [HttpMethod.GET],
      integration: new HttpLambdaIntegration(
        "CurrentPrincipalIntegration",
        currentPrincipalFn
      ),
    });

    httpApi.addRoutes({
      path: "/api/users/me",
      methods: [HttpMethod.GET],
      integration: new HttpLambdaIntegration(
        "GetCurrentUserIntegration",
        getCurrentUserFn
      ),
    });

    const useCustomDomain = new CfnCondition(this, "UseHttpApiCustomDomain", {
      expression: Fn.conditionAnd(
        Fn.conditionNot(Fn.conditionEquals(apiHost.valueAsString, "")),
        Fn.conditionNot(
          Fn.conditionEquals(apiCustomDomainArn.valueAsString, "")
        )
      ),
    });

    const certificate = Certificate.fromCertificateArn(
      this,
      "HttpApiCustomDomainCert",
      apiCustomDomainArn.valueAsString
    );
    const customDomain = new DomainName(this, "HttpApiCustomDomain", {
      domainName: apiHost.valueAsString,
      certificate,
    });
    (customDomain.node.defaultChild as CfnDomainName).cfnOptions.condition =
      useCustomDomain;

    const mapping = new ApiMapping(this, "HttpApiCustomDomainMapping", {
      api: httpApi,
      domainName: customDomain,
      stage: httpApi.defaultStage!,
    });
    (mapping.node.defaultChild as CfnApiMapping).cfnOptions.condition =
      useCustomDomain;

    const domainOutput = new CfnOutput(this, "HttpApiCustomDomainTarget", {
      description:
        "Add a DNS record pointing the configured API_HOST to this target (value includes hosted-zone id)",
      value: `${customDomain.regionalDomainName} (zone: ${customDomain.regionalHostedZoneId})`,
    });
    domainOutput.condition = useCustomDomain;

    httpApi.addRoutes({
      path: "/api/ai/general-note/anki-stack",
      methods: [HttpMethod.POST],
      integration: new HttpLambdaIntegration(
        "RequestGeneralNoteAnkiStackIntegration",
        generalNoteJobRequestFn
      ),
    });

    httpApi.addRoutes({
      path: "/api/ai/general-note/jobs/{jobId}",
      methods: [HttpMethod.GET],
      integration: new HttpLambdaIntegration(
        "GetGeneralNoteJobIntegration",
        getGeneralNoteJobFn
      ),
    });

    httpApi.addRoutes({
      path: "/api/general-note/note",
      methods: [HttpMethod.GET],
      integration: new HttpLambdaIntegration(
        "GetGeneralNoteByUrlIntegration",
        getGeneralNoteByUrlFn
      ),
    });

    httpApi.addRoutes({
      path: "/api/general-note/notes",
      methods: [HttpMethod.GET],
      integration: new HttpLambdaIntegration(
        "ListGeneralNotesIntegration",
        listGeneralNotesFn
      ),
    });

    httpApi.addRoutes({
      path: "/api/ai/general-note/notes/{noteId}/cards",
      methods: [HttpMethod.POST],
      integration: new HttpLambdaIntegration(
        "AddGeneralNoteCardIntegration",
        addGeneralNoteCardFn
      ),
    });

    httpApi.addRoutes({
      path: "/api/ai/general-note/notes/{noteId}/cards/{cardId}",
      methods: [HttpMethod.DELETE],
      integration: new HttpLambdaIntegration(
        "DeleteGeneralNoteCardIntegration",
        deleteGeneralNoteCardFn
      ),
    });

    httpApi.addRoutes({
      path: "/api/general-note/notes/{noteId}/review",
      methods: [HttpMethod.PATCH],
      integration: new HttpLambdaIntegration(
        "UpdateNoteReviewIntegration",
        updateNoteReviewFn
      ),
    });

    httpApi.addRoutes({
      path: "/api/dsa/ai-solution",
      methods: [HttpMethod.POST],
      integration: new HttpLambdaIntegration(
        "GenerateAiSolutionIntegration",
        generateAiSolutionFn
      ),
    });

    [usersTable, userDsaTable, userNotesTable, generalNoteJobsTable].forEach(
      (table) => {
        Tags.of(table).add("Environment", stage);
        Tags.of(table).add("Service", "interview-buddy");
      }
    );

    new CfnOutput(this, "ApiEndpoint", {
      value: httpApi.apiEndpoint,
      description: `Base URL for the Interview Buddy HTTP API Gateway (${stage}).`,
    });
  }
}
