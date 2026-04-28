import { type ReactNode, type InputHTMLAttributes, memo } from "react";
import "../styles/input.css";

type InputColor = "primary" | "secondary" | "tertiary";
type InputVariant = "solid" | "outline";
type InputSize = "small" | "default" | "large";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    color?: InputColor;
    variant?: InputVariant;
    inputSize?: InputSize;
    isRounded?: boolean;
    fullWidth?: boolean;
    iconLeft?: ReactNode;
    iconRight?: ReactNode;
    onIconRightClick?: () => void;
}

const Input = memo(({
    color = "primary",
    variant = "solid",
    inputSize = "default",
    isRounded = false,
    fullWidth = false,
    iconLeft,
    iconRight,
    onIconRightClick,
    className = "",
    ...rest
}: InputProps) => {
    const classes = [
        "input-wrapper",
        `input--${color}`,
        `input--${variant}`,
        `input--${inputSize}`,
        isRounded ? "input--rounded" : "",
        fullWidth ? "input--full" : "",
        className,
    ]
        .filter(Boolean)
        .join(" ");

    return (
        <div className={classes}>
            {iconLeft && <span className="input-icon-left">{iconLeft}</span>}
            <input className="input-field" {...rest} />
            {iconRight && (
                onIconRightClick ? (
                    <button
                        type="button"
                        className="input-icon-right input-icon-btn"
                        onClick={onIconRightClick}
                        tabIndex={-1}
                    >
                        {iconRight}
                    </button>
                ) : (
                    <span className="input-icon-right">{iconRight}</span>
                )
            )}
        </div>
    );
});

export default Input;
