"use client";

import { type ReactNode, type Ref, createContext, useContext } from "react";
import {
  Radio as AriaRadio,
  RadioGroup as AriaRadioGroup,
  type RadioGroupProps as AriaRadioGroupProps,
  type RadioProps as AriaRadioProps,
} from "react-aria-components";
import {
  Check,
  CreditCard01,
  ShieldTick,
  User01,
  Zap,
} from "@untitledui-pro/icons/line";
import { cx } from "@/utils/cx";

export interface RadioGroupContextType {
  size?: "sm" | "md";
}

const RadioGroupContext = createContext<RadioGroupContextType | null>(null);

export interface RadioButtonBaseProps {
  size?: "sm" | "md";
  className?: string;
  isFocusVisible?: boolean;
  isSelected?: boolean;
  isDisabled?: boolean;
}

export const RadioButtonBase = ({
  className,
  isFocusVisible,
  isSelected,
  isDisabled,
  size = "sm",
}: RadioButtonBaseProps) => {
  return (
    <div
      className={cx(
        "flex size-4 shrink-0 cursor-pointer appearance-none items-center justify-center rounded-full bg-primary ring-1 ring-primary ring-inset",
        size === "md" && "size-5",
        isSelected && "bg-brand-solid ring-brand-solid",
        isDisabled && "cursor-not-allowed opacity-50",
        isDisabled && !isSelected && "bg-tertiary",
        isFocusVisible && "outline-2 outline-offset-2 outline-focus-ring",
        className,
      )}
    >
      <div
        className={cx(
          "size-1.5 rounded-full bg-fg-white opacity-0 transition-inherit-all",
          size === "md" && "size-2",
          isSelected && "opacity-100",
        )}
      />
    </div>
  );
};
RadioButtonBase.displayName = "RadioButtonBase";

interface RadioButtonProps extends AriaRadioProps {
  size?: "sm" | "md";
  label?: ReactNode;
  hint?: ReactNode;
  ref?: Ref<HTMLLabelElement>;
}

export const RadioButton = ({
  label,
  hint,
  className,
  size = "sm",
  ...ariaRadioProps
}: RadioButtonProps) => {
  const context = useContext(RadioGroupContext);

  size = context?.size ?? size;

  const sizes = {
    sm: {
      root: "gap-2",
      textWrapper: "",
      label: "text-sm font-medium",
      hint: "text-sm",
    },
    md: {
      root: "gap-3",
      textWrapper: "gap-0.5",
      label: "text-md font-medium",
      hint: "text-md",
    },
  };

  return (
    <AriaRadio
      {...ariaRadioProps}
      className={(state) =>
        cx(
          "relative flex items-start",
          state.isDisabled && "cursor-not-allowed",
          sizes[size].root,
          typeof className === "function" ? className(state) : className,
        )
      }
    >
      {({ isSelected, isDisabled, isFocusVisible }) => (
        <>
          <RadioButtonBase
            size={size}
            isSelected={isSelected}
            isDisabled={isDisabled}
            isFocusVisible={isFocusVisible}
            className={label || hint ? "mt-0.5" : ""}
          />
          {(label || hint) && (
            <div
              className={cx("inline-flex flex-col", sizes[size].textWrapper)}
            >
              {label && (
                <p
                  className={cx(
                    "text-secondary select-none",
                    sizes[size].label,
                  )}
                >
                  {label}
                </p>
              )}
              {hint && (
                <span
                  className={cx("text-tertiary", sizes[size].hint)}
                  onClick={(event) => event.stopPropagation()}
                >
                  {hint}
                </span>
              )}
            </div>
          )}
        </>
      )}
    </AriaRadio>
  );
};
RadioButton.displayName = "RadioButton";

interface RadioGroupItemProps extends AriaRadioProps {
  size?: "sm" | "md";
  title: ReactNode;
  description?: ReactNode;
  meta?: ReactNode;
  variant?:
    | "icon-simple"
    | "icon-card"
    | "avatar"
    | "payment"
    | "checkbox"
    | "radio";
  ref?: Ref<HTMLLabelElement>;
}

const itemSizes = {
  sm: {
    root: "p-4",
    title: "text-sm",
    description: "text-sm",
    media: "size-10",
  },
  md: {
    root: "p-5",
    title: "text-md",
    description: "text-md",
    media: "size-12",
  },
};

function RadioGroupMedia({
  variant,
  selected,
  size,
}: {
  variant: NonNullable<RadioGroupItemProps["variant"]>;
  selected: boolean;
  size: "sm" | "md";
}) {
  const sizes = itemSizes[size];

  if (variant === "avatar") {
    return (
      <span
        className={cx(
          "inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-secondary ring-1 ring-secondary",
          sizes.media,
        )}
      >
        <img
          src="/img/placeholders/portrait/portrait-1.jpg"
          alt=""
          className="h-full w-full object-cover"
          loading="lazy"
        />
      </span>
    );
  }

  if (variant === "payment") {
    return (
      <span
        className={cx(
          "inline-flex shrink-0 items-center justify-center rounded-lg bg-secondary text-brand-secondary ring-1 ring-secondary",
          sizes.media,
        )}
      >
        <CreditCard01 className="size-5" aria-hidden="true" />
      </span>
    );
  }

  if (variant === "checkbox") {
    return (
      <span
        className={cx(
          "inline-flex size-5 shrink-0 items-center justify-center rounded-md border border-secondary bg-primary text-transparent",
          selected && "border-brand bg-brand-solid text-white",
        )}
        aria-hidden="true"
      >
        {selected && <Check className="size-3.5" aria-hidden="true" />}
      </span>
    );
  }

  if (variant === "radio") {
    return <RadioButtonBase size={size} isSelected={selected} />;
  }

  const Icon =
    variant === "icon-card"
      ? ShieldTick
      : variant === "icon-simple"
        ? Zap
        : User01;

  return (
    <span
      className={cx(
        "inline-flex shrink-0 items-center justify-center rounded-lg bg-secondary text-brand-secondary ring-1 ring-secondary",
        sizes.media,
      )}
    >
      <Icon className="size-5" aria-hidden="true" />
    </span>
  );
}

export const RadioGroupItem = ({
  title,
  description,
  meta,
  variant = "icon-simple",
  className,
  size = "sm",
  ...ariaRadioProps
}: RadioGroupItemProps) => {
  const context = useContext(RadioGroupContext);
  size = context?.size ?? size;
  const sizes = itemSizes[size];

  return (
    <AriaRadio
      {...ariaRadioProps}
      className={(state) =>
        cx(
          "group relative flex min-w-0 cursor-pointer items-start gap-3 rounded-xl border border-secondary bg-primary shadow-xs transition hover:bg-secondary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring",
          sizes.root,
          state.isSelected && "border-brand bg-primary ring-1 ring-brand",
          state.isDisabled && "cursor-not-allowed opacity-50",
          variant === "icon-card" && "min-h-36 flex-col",
          typeof className === "function" ? className(state) : className,
        )
      }
    >
      {({ isSelected }) => (
        <>
          <RadioGroupMedia
            variant={variant}
            selected={isSelected}
            size={size}
          />
          <span className="min-w-0 flex-1">
            <span
              className={cx("block font-semibold text-primary", sizes.title)}
            >
              {title}
            </span>
            {description && (
              <span
                className={cx("mt-1 block text-tertiary", sizes.description)}
              >
                {description}
              </span>
            )}
            {meta && (
              <span className="mt-3 block text-sm font-medium text-brand-secondary">
                {meta}
              </span>
            )}
          </span>
          {variant !== "checkbox" && variant !== "radio" && (
            <RadioButtonBase
              size={size}
              isSelected={isSelected}
              className="ml-auto mt-0.5"
            />
          )}
        </>
      )}
    </AriaRadio>
  );
};
RadioGroupItem.displayName = "RadioGroupItem";

interface RadioGroupProps extends RadioGroupContextType, AriaRadioGroupProps {
  children: ReactNode;
  className?: string;
}

export const RadioGroup = ({
  children,
  className,
  size = "sm",
  ...props
}: RadioGroupProps) => {
  return (
    <RadioGroupContext.Provider value={{ size }}>
      <AriaRadioGroup
        {...props}
        className={cx("flex flex-col gap-4", className)}
      >
        {children}
      </AriaRadioGroup>
    </RadioGroupContext.Provider>
  );
};
