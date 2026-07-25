import type { ApplicationContext } from './application-context';

/** Contract implemented by command and query handlers in application modules. */
export interface UseCase<TInput, TOutput> {
  execute(context: ApplicationContext, input: TInput): Promise<TOutput>;
}
