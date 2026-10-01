'use client';

import React from 'react';
import { Button, type ButtonProps } from '@/components/ui/button';

/** Primary action — game accent gradient from the nearest [data-game] scope. */
export function PrimaryButton(props: ButtonProps) {
  return <Button variant="primary" {...props} />;
}

/** Secondary action — neutral Layer 1 surface with accent hover affordances. */
export function SecondaryButton(props: ButtonProps) {
  return <Button variant="secondary" {...props} />;
}
