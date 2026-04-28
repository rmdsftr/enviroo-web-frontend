import { type ReactNode, type ButtonHTMLAttributes, memo } from "react";
import "../styles/button.css";

type ButtonColor = "primary" | "secondary" | "tertiary" | "neon" | "danger";
type ButtonVariant = "solid" | "outline" | "ghost";
type ButtonSize = "small" | "default" | "large";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    children: ReactNode;
    color?: ButtonColor;
    variant?: ButtonVariant;
    size?: ButtonSize;
    isRounded?: boolean;
    fullWidth?: boolean;
    icon?: ReactNode;
}

const Button = memo(({
    children,
    color = "primary",
    variant = "solid",
    size = "default",
    isRounded = false,
    fullWidth = false,
    icon,
    className = "",
    ...rest
}: ButtonProps) => {
    const classes = [
        "btn",
        `btn--${color}`,
        `btn--${variant}`,
        `btn--${size}`,
        isRounded ? "btn--rounded" : "",
        fullWidth ? "btn--full" : "",
        className,
    ]
        .filter(Boolean)
        .join(" ");

    return (
        <button className={classes} {...rest}>
            {icon && <span className="btn-icon">{icon}</span>}
            {children}
        </button>
    );
});

export default Button;
