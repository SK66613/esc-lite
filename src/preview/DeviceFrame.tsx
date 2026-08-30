import type { ReactNode } from 'react';export function DeviceFrame({mode,children}:{mode:'phone'|'full';children:ReactNode}){return <div className={`device ${mode}`}>{children}</div>}
