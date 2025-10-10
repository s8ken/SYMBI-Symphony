import * as React from 'react';
import TextField from '@mui/material/TextField';

export default function A11yTextField({
  id,
  label,
  value,
  onChange,
  error,
  helperText,
  required = false,
  autoFocus = false,
  inputRef,
  ...rest
}) {
  const descId = helperText ? `${id}-desc` : undefined;
  
  return (
    <TextField
      id={id}
      label={label}
      value={value}
      onChange={onChange}
      required={required}
      autoFocus={autoFocus}
      error={Boolean(error)}
      inputRef={inputRef}
      inputProps={{ 'aria-describedby': descId }}
      helperText={helperText ? <span id={descId}>{helperText}</span> : null}
      FormHelperTextProps={{ role: error ? 'alert' : undefined }}
      {...rest}
    />
  );
}