export const TYPES = {
  // Core services
  Logger: Symbol.for('Logger'),

  // Configuration services
  ConfigurationService: Symbol.for('ConfigurationService'),
  AIConfigAccessor: Symbol.for('AIConfigAccessor'),
  PersistenceConfigAccessor: Symbol.for('PersistenceConfigAccessor'),

  // Event system
  EventStore: Symbol.for('EventStore'),
  EventBus: Symbol.for('EventBus'),

  // AI system
  AIService: Symbol.for('AIService'),
  AIManager: Symbol.for('AIManager'),
  OpenAIProvider: Symbol.for('OpenAIProvider'),

  // Tool system
  AIToolManager: Symbol.for('AIToolManager'),
  AIToolExecutor: Symbol.for('AIToolExecutor'),

  // Service layer
  EventCoordinator: Symbol.for('EventCoordinator'),
  ProjectionManager: Symbol.for('ProjectionManager'),

  // Feature services
  ChatService: Symbol.for('ChatService'),
  ProjectService: Symbol.for('ProjectService'),
  ProjectManager: Symbol.for('ProjectManager'),
  VolumeManager: Symbol.for('VolumeManager'),
  FileSystemManager: Symbol.for('FileSystemManager'),
  WorkspaceService: Symbol.for('WorkspaceService'),
  ExplorerService: Symbol.for('ExplorerService'),

  // API services
  VolumeApi: Symbol.for('VolumeApi'),
  ProjectApi: Symbol.for('ProjectApi'),
  FileSystemApi: Symbol.for('FileSystemApi'),

  // Stores
  VolumeStore: Symbol.for('VolumeStore'),
} as const;
