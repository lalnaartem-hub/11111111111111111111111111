import type { AppId } from '../store/system';

export type StoreCategory = 'featured' | 'productivity' | 'dev' | 'games' | 'system' | 'themes';

export interface StoreApp {
  id: string;
  name: string;
  developer: string;
  description: string;
  longDescription: string;
  category: StoreCategory;
  icon: string;
  rating: number;
  downloads: string;
  size: string;
  /** Приложение ядра — открывает встроенное окно */
  launchAppId?: AppId;
  /** Пакет для терминала (apt install) */
  packageName?: string;
  featured?: boolean;
}

export const STORE_APPS: StoreApp[] = [
  {
    id: 'browser-terminal',
    name: 'Terminal Pro',
    developer: 'Browser OS',
    description: 'Полноценная консоль Linux/Windows',
    longDescription: 'Поддержка ls, apt, sudo, dir, tree и сотен команд в зависимости от выбранной ОС.',
    category: 'featured',
    icon: 'terminal',
    rating: 4.9,
    downloads: '12K',
    size: '2 MB',
    launchAppId: 'terminal',
    featured: true,
  },
  {
    id: 'files-plus',
    name: 'Проводник+',
    developer: 'Browser OS',
    description: 'Файлы в стиле Windows',
    longDescription: 'Боковая панель, сетка, горячие клавиши Ctrl+N, Del, F5.',
    category: 'featured',
    icon: 'files',
    rating: 4.8,
    downloads: '9K',
    size: '4 MB',
    launchAppId: 'files',
    featured: true,
  },
  {
    id: 'emulator-pack',
    name: 'x86 DOS Runner',
    developer: 'v86 Project',
    description: 'Запуск .com и DOS .exe',
    longDescription: 'FreeDOS + дискета A: для программ из папки Файлы.',
    category: 'featured',
    icon: 'emulator',
    rating: 4.5,
    downloads: '5K',
    size: '48 MB',
    launchAppId: 'emulator',
    featured: true,
  },
  {
    id: 'calc',
    name: 'Калькулятор',
    developer: 'Browser OS',
    description: 'Научный калькулятор',
    longDescription: 'Базовые и процентные операции.',
    category: 'productivity',
    icon: 'calculator',
    rating: 4.7,
    downloads: '7K',
    size: '1 MB',
    launchAppId: 'calculator',
  },
  {
    id: 'editor',
    name: 'TextPad',
    developer: 'Browser OS',
    description: 'Редактор кода и заметок',
    longDescription: 'Работа с файлами /home и экспорт.',
    category: 'productivity',
    icon: 'editor',
    rating: 4.6,
    downloads: '6K',
    size: '3 MB',
    launchAppId: 'editor',
  },
  {
    id: 'taskmgr',
    name: 'Монитор системы',
    developer: 'Browser OS',
    description: 'Процессы и память',
    longDescription: 'Список PID, завершение процессов.',
    category: 'system',
    icon: 'taskmanager',
    rating: 4.4,
    downloads: '3K',
    size: '1 MB',
    launchAppId: 'taskmanager',
  },
  {
    id: 'neofetch',
    name: 'neofetch',
    developer: 'Community',
    description: 'Информация о системе в терминале',
    longDescription: 'После установки: neofetch в терминале Linux.',
    category: 'dev',
    icon: 'terminal',
    rating: 4.9,
    downloads: '15K',
    size: '500 KB',
    packageName: 'neofetch',
  },
  {
    id: 'htop',
    name: 'htop',
    developer: 'Community',
    description: 'Монитор процессов TUI',
    longDescription: 'Команда htop в Linux-режиме (симуляция).',
    category: 'dev',
    icon: 'taskmanager',
    rating: 4.8,
    downloads: '11K',
    size: '800 KB',
    packageName: 'htop',
  },
  {
    id: 'vim',
    name: 'Vim',
    developer: 'Community',
    description: 'Редактор в терминале',
    longDescription: 'vim &lt;file&gt; — открывает подсказку в редакторе.',
    category: 'dev',
    icon: 'editor',
    rating: 4.5,
    downloads: '20K',
    size: '2 MB',
    packageName: 'vim',
  },
  {
    id: 'snake',
    name: 'Змейка',
    developer: 'Arcade',
    description: 'Классическая игра',
    longDescription: 'Скоро в отдельном окне — пока демо в App Store.',
    category: 'games',
    icon: 'welcome',
    rating: 4.2,
    downloads: '2K',
    size: '600 KB',
  },
  {
    id: 'theme-macos',
    name: 'macOS Theme',
    developer: 'Browser OS',
    description: 'Стиль macOS',
    longDescription: 'Dock снизу, светлые окна, кнопки ● ● ●.',
    category: 'themes',
    icon: 'settings',
    rating: 4.7,
    downloads: '8K',
    size: '0 KB',
    packageName: 'theme-macos',
  },
  {
    id: 'theme-kali',
    name: 'Kali Linux Theme',
    developer: 'Browser OS',
    description: 'Стиль Kali Linux',
    longDescription: 'Панель слева, тёмные окна, дракон, bash.',
    category: 'themes',
    icon: 'settings',
    rating: 4.9,
    downloads: '10K',
    size: '0 KB',
    packageName: 'theme-linux',
  },
];

export const STORE_CATEGORIES: { id: StoreCategory | 'all'; label: string }[] = [
  { id: 'all', label: 'Все' },
  { id: 'featured', label: 'Рекомендуем' },
  { id: 'productivity', label: 'Работа' },
  { id: 'dev', label: 'Разработка' },
  { id: 'games', label: 'Игры' },
  { id: 'system', label: 'Система' },
  { id: 'themes', label: 'Темы ОС' },
];
