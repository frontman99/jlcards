import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin,
  ILabShell,
  ILayoutRestorer,
  LayoutRestorer,
} from "@jupyterlab/application";
import { ToolbarButton, WidgetTracker } from "@jupyterlab/apputils";
import { DocumentManager, IDocumentManager } from "@jupyterlab/docmanager";
import { NotebookPanel, INotebookModel } from "@jupyterlab/notebook";
import { DocumentRegistry } from "@jupyterlab/docregistry";
import { IDisposable } from "@lumino/disposable";
import {
  modelCardExtensionID,
  commandModifyStage,
  createModelCard,
  extensionCategory,
  extensionCaption,
} from "./constants";
import { ModelCardPanel } from "./panel";
import { PathExt } from "@jupyterlab/coreutils";

function makeid(length: number) {
  var result = "";
  var characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  var charactersLength = characters.length;
  for (var i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}

/**
 * A notebook widget extension that adds a jupyterlab classic button to the toolbar.
 */
class ModelCardButton
  implements DocumentRegistry.IWidgetExtension<NotebookPanel, INotebookModel> {
  /**
   * Instantiate a new ClassicButton.
   * @param _app The JupyterFrontEnd app.
   * @param _modelCardPanel The model card object
   */
  // private _modelCardPanel: ModelCardPanel;
  private _app: JupyterFrontEnd;
  private _docManager: IDocumentManager;
  private _modelCardPanel: ModelCardPanel;
  private _context: DocumentRegistry.IContext<INotebookModel>;

  constructor(app: JupyterFrontEnd, docManager: IDocumentManager) {
    this._app = app;
    this._docManager = docManager;
  }

  /**
   * Create a new extension object.
   */
  createNew(
    panel: NotebookPanel,
    context: DocumentRegistry.IContext<INotebookModel>
  ): IDisposable {
    let modelCardPanel: ModelCardPanel;

    function popUpLauncher(modelCardPanel: ModelCardPanel) {
      modelCardPanel.launchPanel();
    }

    const createPanel = () => {
      context.ready.then(() => {
        this._context = context;
        let modelCardTitle = PathExt.basename(context.path);
        modelCardTitle = modelCardTitle.split(
          PathExt.extname(modelCardTitle)
        )[0];
        modelCardTitle = modelCardTitle.split(" ").join("_");
        modelCardTitle = modelCardTitle + ".modelcard";
        if (!modelCardPanel) {
          modelCardPanel = new ModelCardPanel(
            this._app,
            this._docManager,
            makeid(10),
            modelCardTitle,
            createPanel
          );
          modelCardPanel.setContext(this._context);
          modelCardPanel.setPanel(panel);
          this._modelCardPanel = modelCardPanel;
          if (!this._app.commands.hasCommand(commandModifyStage)) {
            this._app.commands.addCommand(commandModifyStage, {
              label: "[Model Card] Change stage to...",
              execute: () => {
                popUpLauncher(this._modelCardPanel);
              },
            });
            this._app.contextMenu.addItem({
              command: commandModifyStage,
              selector: ".jp-CodeCell",
            });
          }
          this._app.docRegistry.addWidgetExtension("Notebook", modelCardPanel);
          this._app.shell.add(modelCardPanel, "main", { mode: "split-right" });
          this._app.shell.activateById(modelCardPanel.id);
          modelCardPanel.update();
        } else if (modelCardPanel && !modelCardPanel.isAttached) {
          modelCardPanel.setContext(this._context);
          modelCardPanel.setPanel(panel);
          this._app.shell.add(modelCardPanel, "main", { mode: "split-right" });
          this._app.shell.activateById(modelCardPanel.id);
          this._modelCardPanel = modelCardPanel;
          modelCardPanel.update();
        } else if (modelCardPanel && !modelCardPanel.isVisible) {
          modelCardPanel.setContext(this._context);
          modelCardPanel.setPanel(panel);
          this._app.shell.activateById(modelCardPanel.id);
          this._modelCardPanel = modelCardPanel;
          modelCardPanel.update();
        } else if (modelCardPanel) {
          if (this._app.shell.currentWidget === modelCardPanel) {
            this._app.shell.currentWidget.dispose();
            modelCardPanel = new ModelCardPanel(
              this._app,
              this._docManager,
              makeid(10),
              modelCardTitle,
              createPanel
            );
            modelCardPanel.setContext(this._context);
            modelCardPanel.setPanel(panel);
            this._modelCardPanel = modelCardPanel;
            if (!this._app.commands.hasCommand(commandModifyStage)) {
              this._app.commands.addCommand(commandModifyStage, {
                label: "[Model Card] Change stage to...",
                execute: () => {
                  popUpLauncher(this._modelCardPanel);
                },
              });
              this._app.contextMenu.addItem({
                command: commandModifyStage,
                selector: ".jp-CodeCell",
              });
            }
            this._app.docRegistry.addWidgetExtension(
              "Notebook",
              modelCardPanel
            );
            this._app.shell.add(modelCardPanel, "main", {
              mode: "split-right",
            });
            this._app.shell.activateById(modelCardPanel.id);
            modelCardPanel.update();
          } else {
            modelCardPanel.setContext(this._context);
            modelCardPanel.setPanel(panel);
            modelCardPanel.update();
          }
        }
      });
    };

    const button = new ToolbarButton({
      tooltip: "Generate model card",
      className: "myButton",
      onClick: () => {
        createPanel();
      },
      label: "Model Card",
    });

    panel.toolbar.insertItem(0, "jupyterlabClassic", button);

    if (!this._app.commands.hasCommand(createModelCard)) {
      this._app.commands.addCommand(createModelCard, {
        label: extensionCategory,
        caption: extensionCaption,
        isVisible: () => false,
        execute: createPanel,
      });
    }

    return button;
  }
}

/**
 * Initialization data for the jlmc extension.
 */
const extension: JupyterFrontEndPlugin<void> = {
  id: modelCardExtensionID,
  autoStart: true,
  requires: [IDocumentManager, ILayoutRestorer],
  activate: (
    app: JupyterFrontEnd,
    docManager: IDocumentManager,
    restorer: ILayoutRestorer
  ) => {
    console.log("JupyterLab extension jlcards is activated!");
    const tracker = new WidgetTracker<ModelCardPanel>({
      namespace: "model-card",
    });
    restorer.restore(tracker, {
      command: createModelCard,
      name: () => "model-card",
    });
    const modelCardButton = new ModelCardButton(app, docManager);
    app.docRegistry.addWidgetExtension("Notebook", modelCardButton);
  },
};

export default extension;
