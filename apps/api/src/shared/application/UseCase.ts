
import { Result } from '../domain/Result';

interface IUseCase<IRequest, IResponse> {
  execute(request?: IRequest): Promise<Result<IResponse>> | Result<IResponse>;
}

export type { IUseCase };
