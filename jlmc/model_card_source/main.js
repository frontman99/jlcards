"use strict";
// COMMAND: node main.js ../assets/News_Categorization_MNB.ipynb

var py = require("./es5");
var graphing = require("./graph.js").Graph;
var fs = require("fs");
var ic = require("./infocell.js");
var dep = require("./cell_deps.js");
const SCHEMAS_PATH = "/lale/sklearn/";
var path = require("path");

var countLines = 0;

const stages = new Map([
  ["plotting", "Plotting"],
  ["datacleaning", "Data Cleaning"],
  ["preprocessing", "Preprocessing"],
  ["hyperparameters", "Hyperparameters"],
  ["modeltraining", "Model Training"],
  ["modelevaluation", "Model Evaluation"],
  ["miscellaneous", "Ignore"],
]);

class ModelCard {
  constructor() {
    try {
      const config = fs
        .readFileSync(
          path.dirname(process.argv[2]) + path.sep + "modelcard.config"
        )
        .toString();
      let sections = JSON.parse(config);
      this.JSONSchema = {
        modelname: { title: "", Filename: "", cell_ids: [] },
        miscellaneous: {
          title: "Miscellaneous",
          cell_ids: [],
          cells: [],
          lineNumbers: [],
          source: "",
          markdown: "",
          imports: [],
          functions: "",
          figures: [],
          description: "",
          outputs: [],
        },
      };
      sections["sections"].forEach((s) => {
        var keyName = s.split(" ").join("").toLowerCase();
        if (keyName === "trainingprocedureanddata") {
          keyName = "modeltraining";
        } else if (keyName === "evaluationprocedureanddata") {
          keyName = "modelevaluation";
        }
        this.JSONSchema[
          keyName
        ] = {
          title: s,
          cell_ids: [],
          cells: [],
          lineNumbers: [],
          source: "",
          markdown: "",
          imports: [],
          functions: [],
          figures: [],
          description: "",
          outputs: [],
        };
      });
    } catch (err) {
      const defaultSections = [
           "Basic information",
           "Intended Use",
           "Factors",
           "Ethical Considerations",
           "Caveats and Recommendations",
           "Libraries",
           "Datasets",
           "References",
           "Data Cleaning",
           "Preprocessing",
           "Training Procedure and Data",
           "Evaluation Procedure and Data",
           "Hyperparameters",
           "Plotting",
           "Disaggregated Evaluation Result",
           "Miscellaneous"
        ]
        this.JSONSchema = {
          modelname: { title: "", Filename: "", cell_ids: [] },
          miscellaneous: {
            title: "Miscellaneous",
            cell_ids: [],
            cells: [],
            lineNumbers: [],
            source: "",
            markdown: "",
            imports: [],
            functions: "",
            figures: [],
            description: "",
            outputs: [],
          },
        };
        defaultSections.forEach((s) => {
          var keyName = s.split(" ").join("").toLowerCase();
          if (keyName === "trainingprocedureanddata") {
            keyName = "modeltraining";
          } else if (keyName === "evaluationprocedureanddata") {
            keyName = "modelevaluation";
          }
          this.JSONSchema[
            keyName
          ] = {
            title: s,
            cell_ids: [],
            cells: [],
            lineNumbers: [],
            source: "",
            markdown: "",
            imports: [],
            functions: [],
            figures: [],
            description: "",
            outputs: [],
          };
        });
    }
    this.line_to_cell = {};
    this.markdown = "";
    this.intended_use = "";
    this.ethical_considerations = "";
    this.developer_comments = "";
    this.hyperparamschemas = {};
  }

  getStageLineNumbers(stage_name) {
    return this.JSONSchema[stage_name]["lineNumbers"];
  }
  getPLineNumbers() {
    return this.JSONSchema["plotting"]["lineNumbers"];
  }
  getDCLineNumbers() {
    return this.JSONSchema["datacleaning"]["lineNumbers"];
  }
  getPPLineNumbers() {
    return this.JSONSchema["preprocessing"]["lineNumbers"];
  }
  getMTLineNumbers() {
    return this.JSONSchema["modeltraining"]["lineNumbers"];
  }
  getMELineNumbers() {
    return this.JSONSchema["modelevaluation"]["lineNumbers"];
  }
}

function createCell(text, executionCount, output) {
  return new ic.InfoCell(text, executionCount, output);
}

function convertColorToLabel(content) {
  // data collection -> red
  // data cleaning -> yellow
  // data labeling -> green
  // feature engineering -> lightblue
  // training -> purple
  // evaluation -> orange
  // model deployment -> pink

  var color_map = dep.printLabels(content);

  var mapObj = {
    red: "Data collection",
    yellow: "Data cleaning",
    green: "Data labelling",
    lightblue: "Plotting",
    blue: "Feature Engineering",
    purple: "Training",
    orange: "Evaluation",
    pink: "Model deployment",
  };

  var re = new RegExp(Object.keys(mapObj).join("|"), "gi");
  color_map = color_map.replace(re, function(matched) {
    return mapObj[matched];
  });

  color_map = color_map.split("\n");
  var new_color_map = {};

  for (let element of color_map) {
    element = element.split("->");
    new_color_map[element[0]] = element[1];
  }

  const testFolder = SCHEMAS_PATH;
  var schemas = {};
  var filenames = fs.readdirSync(__dirname + testFolder);
  filenames.forEach((file) => {
    var newname = file.replace("_", "");
    newname = newname.replace(".py", "");
    schemas[newname] = file;
  });
  return [new_color_map, schemas];
}

function readCells(content) {
  const model_card = new ModelCard();
  let jsondata = JSON.parse(content);

  var temp_res = convertColorToLabel(jsondata);
  var new_color_map = temp_res[0];
  model_card.hyperparamschemas = temp_res[1];

  var notebookCode = "\n";
  var notebookMarkdown = "";
  const rewriter = new py.MagicsRewriter();
  var currStage = "miscellaneous";
  let id_count = 0;
  let flag = true;

  for (let cell of jsondata["cells"]) {
    let currStage = "miscellaneous";
    let sourceCode = "";
    cell["source"] = cell["source"].join("");
    if (cell["cell_type"] === "markdown") {
      if (currStage in model_card.JSONSchema) {
        model_card.JSONSchema[currStage]["markdown"] += "\n" + cell["source"];
      }
      for (let mdline of cell["source"]) {
        var matches = mdline.match(/\bhttps?:\/\/[\S][^)]+/gi);
        if (matches !== null && "references" in model_card.JSONSchema) {
          model_card.JSONSchema["references"]["cell_ids"].push(id_count);
          model_card.JSONSchema["references"]["links"] = model_card.JSONSchema[
            "references"
          ]["links"].concat(matches);
        }
      }
      if (id_count == 0 && flag) {
        flag = false;
        model_card.JSONSchema["modelname"]["title"] = cell["source"][0];
        model_card.JSONSchema["modelname"]["cell_ids"] = id_count;
      }
      id_count += 1;
      notebookMarkdown += cell["source"];
    } else if (cell["source"][0] != undefined) {
      id_count += 1;
      var key = cell["execution_count"].toString();
      // user reclassification
      if (key in new_color_map) {
        var stage = new_color_map[key];
        const metadataStage = cell["metadata"]["stage"];
        // user reclassification
        if (metadataStage !== undefined && stages.has(metadataStage)) {
          currStage = metadataStage;
        } else {
          if (
            stage == "Data collection" ||
            stage == "Data cleaning" ||
            stage == "Data labelling"
          ) {
            currStage = "datacleaning";
          } else if (stage == "Feature Engineering") {
            currStage = "preprocessing";
          } else if (stage == "Training") {
            currStage = "modeltraining";
          } else if (stage == "Evaluation") {
            currStage = "modelevaluation";
          } else if (stage == "Plotting") {
            currStage = "plotting";
          }
        }
      }

      const cells = cell["source"].split("\n");
      for (let line of cells) {
        if (line[0] === "%" || line[0] === "!") {
          line = rewriter.rewriteLineMagic(line);
        }
        countLines += 1;
        if (currStage in model_card.JSONSchema) {
          model_card.JSONSchema[currStage]["lineNumbers"].push(countLines);
        }
        model_card.line_to_cell[countLines] = id_count;
        sourceCode += line + "\n";
      }
      notebookCode += sourceCode;
      let code_cell = createCell(
        sourceCode,
        cell["execution_count"],
        cell["outputs"][0]
      );

      if (cell["outputs"].length != 0) {
        for (let output in cell["outputs"]) {
          if (cell["outputs"][output]["output_type"] == "display_data") {
            if (currStage in model_card.JSONSchema) {
              model_card.JSONSchema[currStage]["figures"].push(
                cell["outputs"][output]["data"]["image/png"]
              );
            }
          } else if (cell["outputs"][output]["output_type"] == "stream") {
            var info = cell["outputs"][output]["text"];
            if (currStage in model_card.JSONSchema) {
              model_card.JSONSchema[currStage]["outputs"].push(info);
            }
          }
        }
      }
      if (currStage in model_card.JSONSchema) {
        model_card.JSONSchema[currStage]["cells"] += JSON.stringify(
          code_cell.text,
          null,
          2
        );
        model_card.JSONSchema[currStage]["source"] += sourceCode;
        model_card.JSONSchema[currStage]["cell_ids"].push(id_count);
      }
    }
  }
  model_card.markdown += notebookMarkdown;
  printLineDefUse(notebookCode, model_card);
  return model_card.JSONSchema;
}

function printLineDefUse(code, model_card) {
  let tree = py.parse(code);
  let cfg = new py.ControlFlowGraph(tree);
  const analyzer = new py.DataflowAnalyzer();
  const flows = analyzer.analyze(cfg).dataflows;

  var importScope = {};
  var lineToCode = {};
  var pLines;
  if ("plotting" in model_card.JSONSchema) {
    pLines = model_card.getPLineNumbers();
  }

  var dcLines;
  if ("datacleaning" in model_card.JSONSchema) {
    dcLines = model_card.getDCLineNumbers();
  }

  var ppLines;
  if ("preprocessing" in model_card.JSONSchema) {
    ppLines = model_card.getPPLineNumbers();
  }

  var mtLines;

  if ("modeltraining" in model_card.JSONSchema) {
    mtLines = model_card.getMTLineNumbers();
  }
  var meLines;
  if ("modelevaluation" in model_card.JSONSchema) {
    meLines = model_card.getMELineNumbers();
  }

  for (let flow of flows.items) {
    let fromNode = py.printNode(flow.fromNode).split("\n");
    let toNode = py.printNode(flow.toNode).split("\n");

    lineToCode[flow.fromNode.location.first_line] = fromNode[0];
    lineToCode[flow.fromNode.location.last_line] =
      fromNode[fromNode.length - 1];
    lineToCode[flow.toNode.location.last_line] = toNode[toNode.length - 1];
    lineToCode[flow.toNode.location.first_line] = toNode[0];

    if (flow.fromNode.type === "from" || flow.fromNode.type === "import") {
      if (
        fromNode[0].includes("sklearn.datasets") &&
        "datasets" in model_card.JSONSchema
      ) {
        model_card.JSONSchema["datasets"]["source"] += fromNode[0];
        model_card.JSONSchema["datasets"]["cell_ids"].push(
          model_card.line_to_cell[flow.fromNode.location.first_line]
        );
      }

      //Check Hyperparameters
      var input = fromNode[0].toLowerCase();
      var hyperparam_descriptions = {};

      Object.keys(model_card.hyperparamschemas).forEach(function(key) {
        if (input.includes(key)) {
          var hcontents = fs.readFileSync(
            __dirname + SCHEMAS_PATH + model_card.hyperparamschemas[key],
            "utf8"
          );
          var hflag = false;
          var pflag = false;
          var hyperflag = false;
          var hyperparams = "";
          var hproperties = "";
          var openbrackets = 0;

          for (let hline of hcontents.split("\n")) {
            if (hline.includes("_hyperparams_schema =")) {
              hyperflag = true;
            }
            if (hyperflag) {
              if (hline.includes("'properties':")) {
                pflag = true;
              }
              openbrackets += (hline.match(/{/g) || []).length;
              openbrackets -= (hline.match(/}/g) || []).length;
            }

            if (hline.includes("relevantToOptimizer")) {
              hflag = true;
            }
            if (hflag) {
              hyperparams += hline;
            }
            if (hline.includes("],")) {
              hflag = false;
            }
            if (pflag == true && hyperflag == true) {
              hproperties = hproperties + hline + "\n";
            }
            if (hyperflag && openbrackets == 0) {
              break;
            }
          }
          hyperparams = hyperparams.substr(hyperparams.indexOf("[") + 1);
          hyperparams = hyperparams.split("]")[0];
          hyperparams = hyperparams.split(",");
          var parameters = [];
          for (let s of hyperparams) {
            s = s.replace(/['"]+/g, "");
            s = s.trim();
            if (s) {
              parameters.push(s);
            }
          }

          pflag = false;
          openbrackets = 0;
          var desc = "";
          var substring = null;
          var param = "";

          function containsAny(str, substrings) {
            for (var i = 0; i != substrings.length; i++) {
              var substring = "'" + substrings[i] + "'";
              if (str.indexOf(substring) != -1) {
                return substring;
              }
            }
            return null;
          }
          for (let line of hproperties.split("\n")) {
            if (!pflag) {
              substring = containsAny(line, parameters);
              if (substring != null) {
                pflag = true;
                param = substring;
              }
            }
            if (pflag) {
              if (line.includes("{")) {
                openbrackets += 1;
              }
              if (line.includes("}")) {
                openbrackets -= 1;
              }
              desc = desc + line + "\n";

              if (openbrackets <= 0) {
                pflag = false;
                hyperparam_descriptions[input] += desc;
                desc = "";
              }
            }
          }
          if ("hyperparameters" in model_card.JSONSchema) {
            model_card.JSONSchema["hyperparameters"]["values"] += parameters;
            model_card.JSONSchema["hyperparameters"]["lineNumbers"].push(
              flow.fromNode.location.first_line
            );
            model_card.JSONSchema["hyperparameters"]["cell_ids"].push(
              model_card.line_to_cell[flow.fromNode.location.first_line]
            );
            model_card.JSONSchema["hyperparameters"]["source"] +=
              fromNode[0] + "\n";
            model_card.JSONSchema["hyperparameters"][
              "description"
            ] = hyperparam_descriptions;
          }
        }
      });
      importScope[flow.fromNode.location.first_line] = -1;

      if ("libraries" in model_card.JSONSchema) {
        model_card.JSONSchema["libraries"]["cell_ids"].push(
          model_card.line_to_cell[flow.fromNode.location.first_line]
        );
      }
    } else if (flow.fromNode.type === "def") {
      if (flow.fromNode.location.first_line in pLines) {
        model_card.JSONSchema["plotting"]["functions"].push(
          py.printNode(flow.fromNode)
        );
      } else if (flow.fromNode.location.first_line in dcLines) {
        model_card.JSONSchema["datacleaning"]["functions"].push(
          py.printNode(flow.fromNode)
        );
      } else if (flow.fromNode.location.first_line in ppLines) {
        model_card.JSONSchema["preprocessing"]["functions"].push(
          py.printNode(flow.fromNode)
        );
      } else if (flow.fromNode.location.first_line in mtLines) {
        model_card.JSONSchema["modeltraining"]["functions"].push(
          py.printNode(flow.fromNode)
        );
      } else if (flow.fromNode.location.first_line in meLines) {
        model_card.JSONSchema["modelevaluation"]["functions"].push(
          py.printNode(flow.fromNode)
        );
        s;
      }
    }
  }
  var n = countLines;
  // need graph size to be size of lineToCode, not number of edges
  var numgraph = new graphing(n + 1);

  for (let flow of flows.items) {
    numgraph.addEdge(
      flow.fromNode.location.first_line,
      flow.toNode.location.first_line
    );
  }
  findImportScope(importScope, lineToCode, numgraph, model_card);
}

function findImportScope(importScope, lineToCode, numgraph, model_card) {
  var importCode = Object.keys(importScope);
  var scopes = {};
  var imports = {};

  for (let lineNum of importCode) {
    var result = numgraph.findLongestPathSrc(
      numgraph.edge.length,
      parseInt(lineNum)
    );
    scopes[lineNum] = result[1];
    imports[lineToCode[lineNum]] =
      "START:" + lineNum.toString() + "\t" + " END:" + scopes[lineNum];

    if (
      "datacleaning" in model_card.JSONSchema &&
      model_card.getDCLineNumbers().includes(parseInt(lineNum))
    ) {
      model_card.JSONSchema["datacleaning"]["imports"].push(
        lineToCode[lineNum]
      );
    } else if (
      "preprocessing" in model_card.JSONSchema &&
      model_card.getPPLineNumbers().includes(parseInt(lineNum))
    ) {
      model_card.JSONSchema["preprocessing"]["imports"].push(
        lineToCode[lineNum]
      );
    } else if (
      "modeltraining" in model_card.JSONSchema &&
      model_card.getMTLineNumbers().includes(parseInt(lineNum))
    ) {
      model_card.JSONSchema["modeltraining"]["imports"].push(
        lineToCode[lineNum]
      );
    } else if (
      "modelevaluation" in model_card.JSONSchema &&
      model_card.getMELineNumbers().includes(parseInt(lineNum))
    ) {
      model_card.JSONSchema["modelevaluation"]["imports"].push(
        lineToCode[lineNum]
      );
    }
  }
  generateLibraryInfo(imports, model_card);
}

function generateLibraryInfo(imports, model_card) {
  let library_defs = {
    numpy: {
      description:
        "Library numerical computation and N-dimensional arrays, mostly used in preprocessing.",
      link: "https://pandas.pydata.org/docs/",
    },
    pandas: {
      description:
        "Library for data analysis and manipulation, mostly used in preprocessing to create dataframes.",
      link: "https://numpy.org/doc/1.19/",
    },
    matplotlib: {
      description:
        "Library to create visualizations of data, mostly used for graphing.",
      link: "https://matplotlib.org/contents.html",
    },
    sklearn: {
      description:
        "Machine learning framework, built on NumPy, mostly used for model training and evaluation.",
      link: "https://scikit-learn.org/stable/user_guide.html",
    },
    tensorflow: {
      description:
        "Machine learning framework based on tensors, mostly used for model training and evaluation.",
      link: "https://www.tensorflow.org/api_docs",
    },
    pytorch: {
      description:
        "Machine learning frameork based on tensors, mostly used for model trainng and evaluation.",
      link: "https://pytorch.org/docs/stable/index.html",
    },
    OTHER: {
      description: "",
    },
  };
  var libraries = {
    pandas: [],
    numpy: [],
    matplotlib: [],
    sklearn: [],
    tensorflow: [],
    pytorch: [],
    OTHER: [],
  };

  for (let im of Object.keys(imports)) {
    if (im.includes("pandas")) {
      libraries["pandas"].push(im);
    } else if (im.includes("numpy")) {
      libraries["numpy"].push(im);
    } else if (im.includes("matplotlib")) {
      libraries["matplotlib"].push(im);
    } else if (im.includes("sklearn")) {
      libraries["sklearn"].push(im);
    } else if (im.includes("tensorflow")) {
      libraries["tensorflow"].push(im);
    } else if (im.includes("pytorch")) {
      libraries["pytorch"].push(im);
    } else {
      libraries["OTHER"].push(im);
    }
  }

  if ("libraries" in model_card.JSONSchema) {
    model_card.JSONSchema["libraries"]["lib"] = libraries;
    model_card.JSONSchema["libraries"]["info"] = library_defs;
  }
}

function generateMarkdown(model_card, notebookCode) {
  var markdown_contents = "";
  var keys = Object.keys(model_card.JSONSchema);

  for (var i = 0, length = keys.length; i < length; i++) {
    var stageKeys = Object.keys(model_card.JSONSchema[keys[i]]);
    for (let stageKey of stageKeys) {
      if (stageKey == "title") {
        markdown_contents +=
          "## " + model_card.JSONSchema[keys[i]][stageKey] + " ##" + "\n";
      } else {
        if (stageKey == "source") {
          markdown_contents += "### " + stageKey + " ###" + "\n";
          markdown_contents +=
            "``` " +
            "\n" +
            model_card.JSONSchema[keys[i]][stageKey] +
            "\n" +
            " ```" +
            "\n";
        } else if (stageKey == "outputs") {
          markdown_contents += "### " + stageKey + " ###" + "\n";
          markdown_contents += model_card.JSONSchema[keys[i]][stageKey] + "\n";
        } else if (stageKey == "imports" || stageKey == "markdown") {
          continue;
        } else if (stageKey == "figures") {
          markdown_contents += "### " + stageKey + " ###" + "\n";
          for (let image of model_card.JSONSchema[keys[i]][stageKey]) {
            markdown_contents +=
              "![" +
              image +
              "](" +
              "../example/" +
              model_card.JSONSchema["modelname"]["Filename"] +
              "/" +
              image +
              ")" +
              "\n";
          }
        } else if (keys[i] == "references" && stageKey == "links") {
          for (let link of model_card.JSONSchema["references"]["links"]) {
            markdown_contents += link + "\n";
          }
        } else {
          markdown_contents += "### " + stageKey + " ###" + "\n";
          markdown_contents +=
            JSON.stringify(model_card.JSONSchema[keys[i]][stageKey]) + "\n";
        }
      }
    }
  }
}

const content = fs.readFileSync(process.argv[2]).toString();
const res = readCells(content);
console.log(JSON.stringify(res));
