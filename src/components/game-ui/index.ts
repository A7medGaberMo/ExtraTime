/**
 * Game UI barrel — every game imports its chrome from here so that only the
 * surrounding `data-game` scope differs between Snipe, Rank, Draft and Bank.
 */
export { GameShell, type GameShellProps } from './game-shell';
export { GameRail, type GameRailProps } from './game-rail';
export { GameBadge, type GameBadgeProps } from './game-badge';
export { GameHub, type GameHubProps } from './game-hub';
export { GameHubCard, useGameTagline, type GameHubCardProps } from './game-hub-card';
export { GameThemeScope, type GameThemeScopeProps } from './game-theme-scope';
export { ResultsCard, type ResultsCardProps } from './results-card';
export { PrimaryButton, SecondaryButton } from './game-buttons';
export { StatPill, type StatPillProps } from './stat-pill';
export { Header as GameHeader, Header, type HeaderProps } from '@/components/layout/header';
