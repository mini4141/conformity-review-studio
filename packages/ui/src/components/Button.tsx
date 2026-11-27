import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { Kbd } from './Badge';
import { Icon, type IconName } from './Icon';
import { Tooltip } from './Overlay';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  /** Visible keyboard-shortcut affordance, e.g. "a" */
  kbd?: string;
  icon?: IconName;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button({ variant = 'secondary', kbd, icon, children, type = 'button', ...rest }, ref) {
  return (
    <button ref={ref} type={type} className="ui-btn" data-variant={variant} {...rest}>
      {icon && <Icon name={icon} />}
      {children}
      {kbd && <Kbd>{kbd}</Kbd>}
    </button>
  );
});

export interface IconButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  icon: IconName;
  /** Required: names the button for assistive tech and for the tooltip. */
  label: string;
  pressed?: boolean;
  extra?: ReactNode;
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton({ icon, label, pressed, type = 'button', ...rest }, ref) {
  return (
    <Tooltip label={label}>
      <button ref={ref} type={type} className="ui-icon-btn" aria-label={label} aria-pressed={pressed} {...rest}>
        <Icon name={icon} />
      </button>
    </Tooltip>
  );
});
