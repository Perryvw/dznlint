// System ports can only be bound once

import { createDiagnosticsFactory } from "../diagnostic";

export const duplicatePortBinding = createDiagnosticsFactory();
