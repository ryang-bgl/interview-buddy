import { GetParameterCommand, SSMClient } from '@aws-sdk/client-ssm';

const ssmClient = new SSMClient({});
const cache = new Map<string, Promise<string>>();

export function getConfigValue(parameterName: string | undefined): Promise<string> {
  if (!parameterName) {
    throw new Error('Parameter name must be provided');
  }

  if (cache.has(parameterName)) {
    return cache.get(parameterName)!;
  }

  const promise = (async () => {
    const response = await ssmClient.send(
      new GetParameterCommand({
        Name: parameterName,
        WithDecryption: true,
      }),
    );

    const value = response.Parameter?.Value;
    if (!value) {
      throw new Error(`Missing value for parameter ${parameterName}`);
    }

    return value;
  })();

  cache.set(parameterName, promise);
  return promise;
}
