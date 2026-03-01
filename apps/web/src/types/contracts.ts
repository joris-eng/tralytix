import type { DevLoginResponseModel } from "@/features/auth/model";
import type { HealthModel, VersionModel } from "@/features/health/model";
import type { Mt5StatusModel } from "@/features/mt5/model";

// Type-level guarantees used by tsc --noEmit.
const _devLoginContract: DevLoginResponseModel = { token: "token" };
const _healthContract: HealthModel = { status: "ok" };
const _versionContract: VersionModel = {
  name: "trading-saas-api",
  version: "0.1.0",
  commit: "dev",
  builtAt: "unknown"
};
const _mt5StatusContract: Mt5StatusModel = { account_id: "id", total_trades: 0 };

void [_devLoginContract, _healthContract, _versionContract, _mt5StatusContract];

