import { Certification } from "../entities/Certification";
import { Result } from "../../shared/Result";

export interface FindCertificationsOptions {
  userId: string;
}

export interface ICertificationRepository {
  findById(id: string, userId: string): Promise<Certification | null>;
  findByUserId(options: FindCertificationsOptions): Promise<Certification[]>;
  save(certification: Certification): Promise<Result<void>>;
  update(certification: Certification): Promise<Result<void>>;
  delete(id: string, userId: string): Promise<Result<void>>;
  deleteAllByUserId(userId: string): Promise<Result<void>>;
}
