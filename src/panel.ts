import { JupyterFrontEnd } from "@jupyterlab/application";
import { IDocumentManager } from "@jupyterlab/docmanager";
import { DocumentRegistry } from "@jupyterlab/docregistry";
import { INotebookModel, NotebookPanel } from "@jupyterlab/notebook";
import { Popup } from "@jupyterlab/statusbar";
import { DisposableDelegate, IDisposable } from "@lumino/disposable";
import { StackedPanel } from "@lumino/widgets";
import { ModelCardWidget } from "./components/ModelCardWidget";
import { PopupWidget } from "./components/PopupWidget";
import { requestAPI } from "./handler";

export class ModelCardPanel extends StackedPanel
  implements DocumentRegistry.IWidgetExtension<NotebookPanel, INotebookModel> {
  private _view: ModelCardWidget;
  private _popup: PopupWidget;
  private _panel: NotebookPanel;
  private _context: DocumentRegistry.IContext<INotebookModel>;
  readonly _app: JupyterFrontEnd;
  readonly _docManager: IDocumentManager;
  private _createPanelHandler: any;

  constructor(
    app: JupyterFrontEnd,
    docManager: IDocumentManager,
    modelCardId: string,
    modelCardTitle: string,
    parent: any
  ) {
    super();
    this._app = app;
    this._docManager = docManager;
    this.id = modelCardId;
    this.title.label = modelCardTitle;
    this.title.closable = true;
    this._createPanelHandler = parent;
  }

  onUpdateRequest(): void {
    if (this._view) {
      this.updateView(this._context.localPath);
      // this._view.update();
    } else {
      this.createView(this._context.localPath);
    }
  }

  setContext(context: DocumentRegistry.IContext<INotebookModel>) {
    this._context = context;
  }

  setPanel(panel: NotebookPanel) {
    this._panel = panel;
  }

  getPopup() {
    return this._popup;
  }

  async getData(path: string): Promise<JSON> {
    const dataToSend = {
      path: path,
    };

    try {
      const reply = await requestAPI<any>("hello", {
        body: JSON.stringify(dataToSend),
        method: "POST",
      });
      return reply;
    } catch (reason) {
      console.error(`Error on POST /jlmc/hello ${dataToSend}.\n${reason}`);
      alert("jlmc ran into errors. Generation Failed.");
    }
  }

  async updateView(path: string) {
    this.getData(path).then((reply) => {
      this._view = new ModelCardWidget(this._panel, this._docManager, reply, this._createPanelHandler);
      this._view.updateModel(this._panel);
      this._view.update();
      this._popup = new PopupWidget(this._panel);
      this._popup.updateModel(this._panel);
    });
  }

  launchPanel() {
    if (this._popup) {
      this._popup.updateModel(this._panel);
      const popup = new Popup({
        body: this._popup,
        anchor: this._panel.content.activeCell,
        align: "right",
      });
      popup.launch();
    }
  }

  async createView(path: string) {
    this.getData(path).then((reply) => {
      this._view = new ModelCardWidget(this._panel, this._docManager, reply, this._createPanelHandler);
      this.addWidget(this._view);
      this._popup = new PopupWidget(this._panel);
      this._view.updateModel(this._panel);
      this._popup.updateModel(this._panel);
    });
  }

  createNew(
    panel: NotebookPanel,
    context: DocumentRegistry.IContext<INotebookModel>
  ): IDisposable {
    return new DisposableDelegate(() => {
      if (this.widgets) {
        this.widgets.forEach((widget) => {
          if (!widget.isDisposed) {
            widget.dispose();
          }
          widget = null;
        });
      }
      this._popup.dispose();
    });
  }
}
