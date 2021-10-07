export const modelCardExtensionID = 'model-card-extension';
export const modelCardWidgetID = 'model-card-extension:widget';
export const modelCardNotebookId = 'model-card-extension:notebook';
export const extensionCategory = 'Model Card';
export const extensionCaption = 'Model Card';
export const createModelCard = 'create-model-card';
export const commandShowModelCard = 'show-model-card';
export const commandModifyStage = 'modify-model-card-stage';

/** Stage keys for quickfix */
export const stages = new Map([
  ['plotting', 'Plotting'],
  ['datacleaning', 'Data Cleaning'],
  ['preprocessing', 'Preprocessing'],
  ['hyperparameters', 'Hyperparameters'],
  ['modeltraining', 'Model Training'],
  ['modelevaluation', 'Model Evaluation'],
  ['miscellaneous', 'Ignore']
]);

export const startTag = (name: string): string => `<!-- @md-${name} -->`;
export const endTag = (name: string): string => `<!-- /md-${name} -->`;
