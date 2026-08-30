import type { ButtonHTMLAttributes, ReactNode } from 'react';
export function Button({variant='primary',className='',children,...props}:ButtonHTMLAttributes<HTMLButtonElement>&{variant?:'primary'|'secondary'|'danger'|'ghost';children:ReactNode}){return <button className={`button ${variant} ${className}`} {...props}>{children}</button>}
