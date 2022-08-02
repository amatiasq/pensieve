import { ButtonHTMLAttributes, ClassAttributes, forwardRef } from 'react';

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> &
  ClassAttributes<HTMLButtonElement>;

export const Button = forwardRef(function Button(props: ButtonProps, ref: any) {
  return <button type="button" role="button" {...props} ref={ref} />;
});
