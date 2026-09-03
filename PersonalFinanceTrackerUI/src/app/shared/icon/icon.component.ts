import { Component, Input, inject } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

export type IconName =
  | 'dashboard' | 'transactions' | 'ai' | 'insights' | 'budget' | 'anomalies' | 'analytics' | 'reports' | 'settings'
  | 'logout' | 'search' | 'command' | 'bell' | 'sun' | 'moon' | 'plus' | 'menu' | 'chevron-left' | 'chevron-right'
  | 'chevron-down' | 'chevron-up' | 'arrow-up' | 'arrow-down' | 'arrow-right' | 'arrow-left' | 'trending-up'
  | 'trending-down' | 'wallet' | 'banknote' | 'credit-card' | 'piggy-bank' | 'target' | 'sparkles' | 'brain'
  | 'warning' | 'alert-triangle' | 'check-circle' | 'x-circle' | 'info' | 'lightbulb' | 'flame' | 'gift'
  | 'shopping' | 'car' | 'home' | 'heart' | 'graduation' | 'plane' | 'utensils' | 'stethoscope' | 'film'
  | 'zap' | 'receipt' | 'calendar' | 'filter' | 'sort' | 'download' | 'upload' | 'trash' | 'edit' | 'eye'
  | 'eye-off' | 'lock' | 'user' | 'mail' | 'phone' | 'shield' | 'clock' | 'activity' | 'pie-chart' | 'bar-chart'
  | 'line-chart' | 'more' | 'dots' | 'x' | 'check' | 'external-link' | 'copy' | 'refresh' | 'help' | 'star'
  | 'trophy' | 'medal' | 'rocket' | 'globe' | 'language' | 'palette' | 'key' | 'fingerprint' | 'bot' | 'send'
  | 'message' | 'loader' | 'circle' | 'dot' | 'percent' | 'scale' | 'coins' | 'hand-coins' | 'flag' | 'bookmark'
  | 'tag' | 'grid' | 'list' | 'sliders' | 'sidebar' | 'arrow-up-right' | 'arrow-down-right' | 'file-text'
  | 'file-spreadsheet' | 'printer' | 'plus-circle' | 'minus-circle' | 'sparkle' | 'wand' | 'magic';

const PATHS: Record<IconName, string> = {
  dashboard: '<rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/>',
  transactions: '<path d="M3 7h18M3 12h18M3 17h12"/><circle cx="20" cy="17" r="1.5"/>',
  ai: '<path d="M12 3l1.6 4.2L18 9l-4.4 1.8L12 15l-1.6-4.2L6 9l4.4-1.8z"/><path d="M19 14l.7 1.8L21.5 16.5 19.7 17.2 19 19l-.7-1.8L16.5 16.5 18.3 15.8z"/>',
  insights: '<path d="M3 3v18h18"/><path d="M7 14l3-4 3 3 4-6"/>',
  budget: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4"/><circle cx="12" cy="12" r="0.5" fill="currentColor"/>',
  anomalies: '<path d="M12 3l9 16H3z"/><path d="M12 10v4M12 17h.01"/>',
  analytics: '<path d="M3 3v18h18"/><rect x="7" y="12" width="3" height="6"/><rect x="12" y="8" width="3" height="10"/><rect x="17" y="5" width="3" height="13"/>',
  reports: '<path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6"/><path d="M8 13h8M8 17h5"/>',
  settings: '<path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>',
  logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="M16 17l5-5-5-5M21 12H9"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/>',
  command: '<path d="M9 6a3 3 0 1 0-3 3h12a3 3 0 1 0-3-3v12a3 3 0 1 0 3-3H6a3 3 0 1 0 3 3z"/>',
  bell: '<path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.7 21a2 2 0 0 1-3.4 0"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M19.1 4.9l-1.4 1.4M6.3 17.7l-1.4 1.4"/>',
  moon: '<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  menu: '<path d="M3 6h18M3 12h18M3 18h18"/>',
  'chevron-left': '<path d="M15 18l-6-6 6-6"/>',
  'chevron-right': '<path d="M9 18l6-6-6-6"/>',
  'chevron-down': '<path d="M6 9l6 6 6-6"/>',
  'chevron-up': '<path d="M18 15l-6-6-6 6"/>',
  'arrow-up': '<path d="M12 19V5M5 12l7-7 7 7"/>',
  'arrow-down': '<path d="M12 5v14M19 12l-7 7-7-7"/>',
  'arrow-right': '<path d="M5 12h14M12 5l7 7-7 7"/>',
  'arrow-left': '<path d="M19 12H5M12 19l-7-7 7-7"/>',
  'trending-up': '<path d="M22 7l-9 9-4-4-7 7"/><path d="M16 7h6v6"/>',
  'trending-down': '<path d="M22 17l-9-9-4 4-7-7"/><path d="M16 17h6v-6"/>',
  wallet: '<path d="M3 7h16a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z"/><path d="M3 7l9-4 4 4"/><circle cx="17" cy="13" r="1.4" fill="currentColor"/>',
  banknote: '<rect x="3" y="6" width="18" height="12" rx="2"/><circle cx="12" cy="12" r="2.5"/><path d="M6 9v6M18 9v6"/>',
  'credit-card': '<rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/>',
  'piggy-bank': '<path d="M19 5c-1.5-1.5-3.5-2-6-2-4.5 0-8 3-8 7 0 1.5.5 3 1 4l-1 2h3l1-1h6l1 1h3l-1-3c1-1 2-2.5 2-4l2-1v-3z"/><circle cx="9" cy="11" r="0.8" fill="currentColor"/>',
  target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1" fill="currentColor"/>',
  sparkles: '<path d="M12 3l1.6 4.4L18 9l-4.4 1.6L12 15l-1.6-4.4L6 9l4.4-1.6z"/><path d="M19 14l.7 2L22 16.7l-2.3.7L19 19.4l-.7-2L16 16.7l2.3-.7z"/>',
  brain: '<path d="M9.5 4a2.5 2.5 0 0 0-2.5 2.5A2.5 2.5 0 0 0 4 9a2.5 2.5 0 0 0 1 4 2.5 2.5 0 0 0 2 4 2.5 2.5 0 0 0 5 0V4z"/><path d="M14.5 4A2.5 2.5 0 0 1 17 6.5 2.5 2.5 0 0 1 20 9a2.5 2.5 0 0 1-1 4 2.5 2.5 0 0 1-2 4 2.5 2.5 0 0 1-5 0"/>',
  warning: '<path d="M12 3l10 18H2z"/><path d="M12 10v5M12 18h.01"/>',
  'alert-triangle': '<path d="M12 3l10 18H2z"/><path d="M12 10v5M12 18h.01"/>',
  'check-circle': '<circle cx="12" cy="12" r="9"/><path d="M8.5 12.5l2.5 2.5 5-5"/>',
  'x-circle': '<circle cx="12" cy="12" r="9"/><path d="M15 9l-6 6M9 9l6 6"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>',
  lightbulb: '<path d="M9 18h6M10 21h4"/><path d="M12 3a6 6 0 0 0-4 10.5c.8.8 1 1.5 1 2.5h6c0-1 .2-1.7 1-2.5A6 6 0 0 0 12 3z"/>',
  flame: '<path d="M12 3c2 3 5 5 5 9a5 5 0 0 1-10 0c0-2 1-3 2-4 0 2 1 3 2 3 0-2-1-4 1-8z"/>',
  gift: '<rect x="3" y="8" width="18" height="4" rx="1"/><path d="M12 8v13M3 12v9h18v-9"/><path d="M12 8S10 4 7 4s-2 4 5 4M12 8s2-4 5-4 2 4-5 4"/>',
  shopping: '<path d="M6 2l-1 4h14l-1-4z"/><path d="M5 6l1 14a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2l1-14"/><path d="M9 11l3 3 3-3"/>',
  car: '<path d="M5 13l1.5-5a2 2 0 0 1 2-1.5h7a2 2 0 0 1 2 1.5L19 13"/><path d="M3 13h18v5h-3v-2H6v2H3z"/><circle cx="7" cy="16" r="1"/><circle cx="17" cy="16" r="1"/>',
  home: '<path d="M3 11l9-7 9 7"/><path d="M5 10v10h14V10"/>',
  heart: '<path d="M12 20s-7-4.5-9-9a4.5 4.5 0 0 1 9-2 4.5 4.5 0 0 1 9 2c-2 4.5-9 9-9 9z"/>',
  graduation: '<path d="M3 9l9-4 9 4-9 4z"/><path d="M7 11v5c0 1 2 2 5 2s5-1 5-2v-5"/>',
  plane: '<path d="M10 16l-7 3 1-4 6-3-2-7 3 1 4 8 6-2 3 1-5 3-2 5-3-1-4-8-3-1z"/>',
  utensils: '<path d="M6 3v8a2 2 0 0 0 2 2v8M6 3v3M9 3v3M9 9V3"/><path d="M16 3c-2 0-3 2-3 5s1 4 3 4v8"/>',
  stethoscope: '<path d="M4 3v6a4 4 0 0 0 8 0V3M6 3v3M10 3v3"/><path d="M8 13v3a5 5 0 0 0 10 0v-2"/><circle cx="18" cy="11" r="2"/>',
  film: '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M7 3v18M17 3v18M3 7h4M3 12h4M3 17h4M17 7h4M17 12h4M17 17h4"/>',
  zap: '<path d="M13 3L4 14h7l-1 7 9-11h-7z"/>',
  receipt: '<path d="M5 3v18l2-1 2 1 2-1 2 1 2-1 2 1V3z"/><path d="M8 8h8M8 12h8M8 16h5"/>',
  calendar: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M3 9h18M8 2v4M16 2v4"/>',
  filter: '<path d="M3 5h18l-7 8v6l-4 2v-8z"/>',
  sort: '<path d="M7 4v16M7 4l-3 3M7 4l3 3M17 20V4M17 20l-3-3M17 20l3-3"/>',
  download: '<path d="M12 3v12M7 10l5 5 5-5"/><path d="M5 21h14"/>',
  upload: '<path d="M12 21V9M7 14l5-5 5 5"/><path d="M5 3h14"/>',
  trash: '<path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M6 6l1 14a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-14"/>',
  edit: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>',
  eye: '<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/>',
  'eye-off': '<path d="M3 3l18 18"/><path d="M10.6 10.6a3 3 0 0 0 4.2 4.2"/><path d="M9.4 5.2A9.5 9.5 0 0 1 12 5c6 0 10 7 10 7a18 18 0 0 1-3 3.7M6.1 6.1A18 18 0 0 0 2 12s4 7 10 7a9.5 9.5 0 0 0 3.4-.6"/>',
  lock: '<rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-6 8-6s8 2 8 6"/>',
  mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/>',
  phone: '<path d="M5 3h4l2 5-2 1a12 12 0 0 0 5 5l1-2 5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 5a2 2 0 0 1 2-2z"/>',
  shield: '<path d="M12 3l8 3v6c0 5-4 8-8 9-4-1-8-4-8-9V6z"/><path d="M9 12l2 2 4-4"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  activity: '<path d="M3 12h4l3 8 4-16 3 8h4"/>',
  'pie-chart': '<path d="M12 3a9 9 0 1 0 9 9h-9z"/><path d="M12 3v9h9"/>',
  'bar-chart': '<path d="M3 3v18h18"/><rect x="7" y="12" width="3" height="6"/><rect x="12" y="8" width="3" height="10"/><rect x="17" y="5" width="3" height="13"/>',
  'line-chart': '<path d="M3 3v18h18"/><path d="M7 14l3-4 3 3 4-6"/>',
  more: '<circle cx="5" cy="12" r="1.5" fill="currentColor"/><circle cx="12" cy="12" r="1.5" fill="currentColor"/><circle cx="19" cy="12" r="1.5" fill="currentColor"/>',
  dots: '<circle cx="5" cy="12" r="1.5" fill="currentColor"/><circle cx="12" cy="12" r="1.5" fill="currentColor"/><circle cx="19" cy="12" r="1.5" fill="currentColor"/>',
  x: '<path d="M18 6L6 18M6 6l12 12"/>',
  check: '<path d="M5 12l5 5 9-11"/>',
  'external-link': '<path d="M14 5h5v5M19 5l-9 9M12 5H6a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2v-6"/>',
  copy: '<rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/>',
  refresh: '<path d="M21 12a9 9 0 1 1-3-6.7L21 8"/><path d="M21 3v5h-5"/>',
  help: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.5 2.5 0 0 1 5 0c0 2-2.5 2-2.5 4M12 17h.01"/>',
  star: '<path d="M12 3l2.6 6.3 6.4.5-4.9 4.2 1.5 6.3L12 17.8 6.4 20.3l1.5-6.3L3 9.8l6.4-.5z"/>',
  trophy: '<path d="M8 4h8v6a4 4 0 0 1-8 0z"/><path d="M8 4H5v2a3 3 0 0 0 3 3M16 4h3v2a3 3 0 0 1-3 3"/><path d="M9 21h6M12 14v7"/>',
  medal: '<circle cx="12" cy="15" r="5"/><path d="M9 10l-2-6h10l-2 6"/><path d="M12 13l1 2h2l-1.5 1.5.5 2-2-1-2 1 .5-2L9 15h2z" fill="currentColor" stroke="none"/>',
  rocket: '<path d="M5 13c-2 0-3 1-3 3l4-1 2-2zM19 13c2 0 3 1 3 3l-4-1-2-2z"/><path d="M12 2c4 2 7 6 7 11l-3 3H8l-3-3c0-5 3-9 7-11z"/><circle cx="12" cy="8" r="1.5"/>',
  globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 0 0 18 14 14 0 0 0 0-18z"/>',
  language: '<path d="M4 5h7M9 3v2c0 4-2 7-5 8M5 9c0 2 3 5 7 6"/><path d="M14 15l4-9 4 9M15.5 12h5"/>',
  palette: '<path d="M12 3a9 9 0 1 0 0 18c1 0 2-1 2-2 0-1.5 1-2 2-2h2a3 3 0 0 0 3-3c0-5-4-9-9-9z"/><circle cx="7.5" cy="11" r="1"/><circle cx="9.5" cy="7" r="1"/><circle cx="14.5" cy="7" r="1"/><circle cx="17" cy="11" r="1"/>',
  key: '<circle cx="8" cy="15" r="4"/><path d="M11 12l9-9M17 7l3 3M15 9l2 2"/>',
  fingerprint: '<path d="M12 11c0 3-1 6-1 6M9 13c0-2 1-3 3-3s3 1 3 3M6 12c0-3 3-6 6-6s6 3 6 6M7.5 16c0 1 0 2 .5 3M16.5 16c0 1 0 2-.5 3M12 16v3"/>',
  bot: '<rect x="4" y="8" width="16" height="12" rx="2"/><path d="M12 4v4M8 12h.01M16 12h.01M9 16h6"/>',
  send: '<path d="M22 3L11 14M22 3l-7 18-4-7-7-4z"/>',
  message: '<path d="M21 12a8 8 0 0 1-12 7l-5 1 1-5a8 8 0 1 1 16-3z"/>',
  loader: '<path d="M12 3a9 9 0 1 0 9 9" stroke-linecap="round"/>',
  circle: '<circle cx="12" cy="12" r="9"/>',
  dot: '<circle cx="12" cy="12" r="3" fill="currentColor" stroke="none"/>',
  percent: '<path d="M19 5L5 19"/><circle cx="7.5" cy="7.5" r="2.5"/><circle cx="16.5" cy="16.5" r="2.5"/>',
  scale: '<path d="M12 3v18M7 7h10M7 7l-3 7h6zM17 7l-3 7h6zM5 21h14"/>',
  coins: '<circle cx="9" cy="9" r="6"/><path d="M15.5 4.2a6 6 0 1 1 0 11.6"/>',
  'hand-coins': '<path d="M12 15V9a2 2 0 0 0-4 0v6M8 11h8a4 4 0 0 1 4 4v3H4v-3a4 4 0 0 1 4-4z"/><circle cx="17" cy="6" r="2"/>',
  flag: '<path d="M5 3v18M5 4h12l-3 4 3 4H5"/>',
  bookmark: '<path d="M6 3h12v18l-6-4-6 4z"/>',
  tag: '<path d="M3 11l8-8 9 9-8 8zM7 7h.01"/>',
  grid: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
  list: '<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>',
  sliders: '<path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6"/>',
  sidebar: '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 3v18"/>',
  'arrow-up-right': '<path d="M7 17L17 7M9 7h8v8"/>',
  'arrow-down-right': '<path d="M7 7l10 10M17 9v8H9"/>',
  'file-text': '<path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6M8 13h8M8 17h5"/>',
  'file-spreadsheet': '<path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6M8 12h8M8 16h8M11 9v9"/>',
  printer: '<path d="M6 9V3h12v6M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="7" rx="1"/>',
  'plus-circle': '<circle cx="12" cy="12" r="9"/><path d="M12 8v8M8 12h8"/>',
  'minus-circle': '<circle cx="12" cy="12" r="9"/><path d="M8 12h8"/>',
  sparkle: '<path d="M12 3l1.6 4.4L18 9l-4.4 1.6L12 15l-1.6-4.4L6 9l4.4-1.6z"/>',
  wand: '<path d="M15 4V2M15 10V8M11 6H9M21 6h-2M18.5 3.5l-1 1M18.5 8.5l-1-1M3 21l12-12"/>',
  magic: '<path d="M9 11l3-3 9 9-3 3zM5 5l1-1 1 1-1 1zM9 3l.5-1L10 3l-.5 1zM3 9l1-.5L4.5 9 4 9.5z"/>',
};

@Component({
  selector: 'app-icon',
  standalone: true,
  template: `
    <svg [attr.width]="size" [attr.height]="size" viewBox="0 0 24 24" fill="none"
         [attr.stroke]="strokeColor" [attr.stroke-width]="strokeWidth"
         stroke-linecap="round" stroke-linejoin="round" [innerHTML]="path" aria-hidden="true"></svg>
  `,
  styles: [`:host{display:inline-flex;line-height:0}`],
})
export class IconComponent {
  @Input() name: IconName = 'circle';
  @Input() size = 20;
  @Input() strokeWidth = 2;
  @Input() strokeColor = 'currentColor';

  private sanitizer = inject(DomSanitizer);

  get path(): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(PATHS[this.name] ?? PATHS['circle']);
  }
}
