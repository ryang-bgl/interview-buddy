import * as path from "node:path";
import {
  Stack,
  StackProps,
  Duration,
  RemovalPolicy,
  CfnOutput,
  CfnParameter,
  Tags,
} from "aws-cdk-lib";
import { Construct } from "constructs";
import {
  AttributeType,
  BillingMode,
  ProjectionType,
  Table,
} from "aws-cdk-lib/aws-dynamodb";
import { Runtime } from "aws-cdk-lib/aws-lambda";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import {
  HttpApi,
  HttpMethod,
  CorsHttpMethod,
  CorsPreflightOptions,
} from "aws-cdk-lib/aws-apigatewayv2";
import { HttpLambdaIntegration } from "aws-cdk-lib/aws-apigatewayv2-integrations";

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

    const supabaseProjectRef = new CfnParameter(this, "SupabaseProjectRef", {
      type: "String",
      description: "Supabase project reference (e.g., abcdefghijklmnoqrst).",
    });

    const supabaseJwtAudience = new CfnParameter(this, "SupabaseJwtAudience", {
      type: "String",
      description: "Expected JWT audience from Supabase tokens.",
      default: "authenticated",
    });

    const supabaseAuthUrl = `https://${supabaseProjectRef.valueAsString}.supabase.co/auth/v1`;
    const supabaseJwksUrl = `${supabaseAuthUrl}/.well-known/jwks.json`;

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

    const commonLambdaEnv = {
      STAGE: stage,
      USERS_TABLE_NAME: usersTable.tableName,
      USERS_TABLE_ID_INDEX_NAME: userIdIndexName,
      SUPABASE_PROJECT_REF: supabaseProjectRef.valueAsString,
      SUPABASE_AUTH_URL: supabaseAuthUrl,
      SUPABASE_JWKS_URL: supabaseJwksUrl,
      SUPABASE_JWT_AUDIENCE: supabaseJwtAudience.valueAsString,
    } as const;

    const defaultLambdaProps = {
      runtime: Runtime.NODEJS_20_X,
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
    usersTable.grantReadWriteData(createUserQuestionFn);
    usersTable.grantReadWriteData(authByApiKeyFn);
    usersTable.grantReadWriteData(currentPrincipalFn);
    usersTable.grantReadWriteData(getCurrentUserFn);

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

    [usersTable, userDsaTable].forEach((table) => {
      Tags.of(table).add("Environment", stage);
      Tags.of(table).add("Service", "interview-buddy");
    });

    new CfnOutput(this, "ApiEndpoint", {
      value: httpApi.apiEndpoint,
      description: `Base URL for the Interview Buddy HTTP API Gateway (${stage}).`,
    });
  }
}
