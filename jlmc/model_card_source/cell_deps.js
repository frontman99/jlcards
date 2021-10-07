var utils = require("./cell_utils.js");

var py = require("./es5");

module.exports = {
    printLabels: function(content) {
        // const programSrc = fs.readFileSync(name).toString();
        // const programJson = JSON.parse(content);
        const programJson = content;
        //dict is a dictionary pointing from execution_count to the corresponding cell
        let dict = new Object();
        let cells = [];
        let text = "";

        let currentLine = 0;
        let currentLineNo = 0;
        let cell_counts = [];

        let map_from_line_to_label = new Object();
        // data collection -> red
        // data cleaning -> yellow
        // data labeling -> green
        // feature engineering -> blue
        // training -> purple
        // evaluation -> orange
        // model deployment -> pink

        var notebookCode = "";
        var res_color_map = "";

        if(programJson.cells == undefined){

            return;
        }

        var last_exe_cnt = -1;

        // relabel cells with no execution counts
        for (let cell of programJson.cells){
            if(cell.execution_count == null){
                cell.execution_count = last_exe_cnt + 1;
            }
            last_exe_cnt = cell.execution_count;
        }

        var flag = false;
        var plt = "####@@@@";

        for (let cell of programJson.cells){
            if (cell.cell_type === 'code'){
                cell_counts.push(cell.execution_count);
                var sourceCode = "";
                // const cells = cell.source.split("\n");
                for(let line of cell.source){
                    line += "\n"
                    if(!(line[0] == '%') && !(line[0] == '!')){
                        sourceCode += line;
                    }
                    else{
                        sourceCode += '#' + line;
                    }

                    // included plotting from the libraries listed here
                    // https://mode.com/blog/python-data-visualization-libraries/
                    if(line.includes('import matplotlib.pyplot') ||
                        line.includes('import matplotlib') ||
                        line.includes('import seaborn') ||
                        line.includes('import plotly') ||
                        line.includes('import bokeh') ||
                        line.includes('import plotly') ||
                        line.includes('import plotly.express')
                        ){
                            plt = line.split(" ")
                            if (plt.length > 2) {
                                plt = plt[3]
                            } else {
                                plt = plt[1]
                            }
                        flag = true;
                    }


                    if((!line.includes('import ')) && flag && line.split(" ").includes(plt) /*line.includes(plt)*/){
                        //console.log('entered plt\n');
                        map_from_line_to_label[currentLineNo] = 'plotting';
                        //console.log('label: plotting\n' + line + '\n');
                    }


                    if((!line.includes('import ')) && (!(line[0] == '#'))){

                        if(line.includes('read_csv')){
                            map_from_line_to_label[currentLineNo] = 'data collection';
                            //console.log('label: data collection\n' + line + '\n');
                        }
                        //special case: consider improving this
                        else if(line.includes('scaler.fit')){
                            map_from_line_to_label[currentLineNo] = 'feature engineering';
                            //console.log('label: feature engineering\n' + line + '\n');
                        }
                        else if(line.includes('predict_proba')){
                            map_from_line_to_label[currentLineNo] = 'training';
                            //console.log('label: training\n' + line + '\n');
                        }
                        else if(line.includes('fit_predict')){
                            map_from_line_to_label[currentLineNo] = 'evaluation';
                            //console.log('label: evaluation\n' + line + '\n');
                        }
                        else if(line.includes('predict')){
                            map_from_line_to_label[currentLineNo] = 'evaluation';
                            //console.log('label: evaluation\n' + line + '\n');
                        }
                        else if(line.includes('accuracy_score')){
                            map_from_line_to_label[currentLineNo] = 'evaluation';
                            //console.log('label: evaluation\n' + line + '\n');
                        }
                        else if(line.includes('classification_report')){
                            map_from_line_to_label[currentLineNo] = 'evaluation';
                            //console.log('label: evaluation\n' + line + '\n');
                        }
                        else if(line.includes('confusion_matrix')){
                            map_from_line_to_label[currentLineNo] = 'evaluation';
                            //console.log('label: evaluation\n' + line + '\n');
                        }
                        else if(line.includes('f1_score')){
                            map_from_line_to_label[currentLineNo] = 'evaluation';
                            //console.log('label: evaluation\n' + line + '\n');
                        }
                        else if(line.includes('train_test_split')){
                            map_from_line_to_label[currentLineNo] = 'data labeling';
                            //console.log('label: data labeling\n' + line + '\n');
                        }
                        else if(line.includes('LinearRegression')){
                            map_from_line_to_label[currentLineNo] = 'training';
                            //console.log('label: training\n' + line + '\n');
                        }
                            // else if(line.includes('score')){
                            //     map_from_line_to_label[currentLineNo] = 'evaluation';
                            //     //console.log('label: evaluation\n' + line + '\n');
                        // }
                        else if(line.includes('permutation_importance')){
                            map_from_line_to_label[currentLineNo] = 'evaluation';
                            //console.log('label: evaluation\n' + line + '\n');
                        }
                        else if(line.includes('ColumnTransformer')){
                            map_from_line_to_label[currentLineNo] = 'training';
                            //console.log('label: training\n' + line + '\n');
                        }
                        else if(line.includes('OrdinalEncoder')){
                            map_from_line_to_label[currentLineNo] = 'feature engineering';
                            //console.log('label: feature engineering\n' + line + '\n');
                        }
                        else if(line.includes('HistGradientBoostingRegressor')){
                            map_from_line_to_label[currentLineNo] = 'training';
                            //console.log('label: training\n' + line + '\n');
                        }
                            // else if(line.includes('RandomizedSearchCV')){
                            //     map_from_line_to_label[currentLineNo] = 'model deployment';
                            //     //console.log('label: model deployment\n' + line + '\n');
                        // }
                        else if(line.includes('RandomizedSearchCV')){
                            map_from_line_to_label[currentLineNo] = 'training';
                            //console.log('label: training\n' + line + '\n');
                        }
                        else if(line.includes('make_classification')){
                            map_from_line_to_label[currentLineNo] = 'data collection';
                            //console.log('label: data collection\n' + line + '\n');
                        }
                        else if(line.includes('decision_function')){
                            map_from_line_to_label[currentLineNo] = 'training';
                            //console.log('label: training\n' + line + '\n');
                        }
                            // else if(line.includes('calibration_curve')){
                            //     map_from_line_to_label[currentLineNo] = 'model deployment';
                            //     //console.log('label: model deployment\n' + line + '\n');
                        // }
                        else if(line.includes('calibration_curve')){
                            map_from_line_to_label[currentLineNo] = 'training';
                            //console.log('label: training\n' + line + '\n');
                        }
                        else if(line.includes('LinearSVC')){
                            map_from_line_to_label[currentLineNo] = 'training';
                            //console.log('label: training\n' + line + '\n');
                        }
                        else if(line.includes('cross_val_score')){
                            map_from_line_to_label[currentLineNo] = 'evaluation';
                            //console.log('label: evaluation\n' + line + '\n');
                        }
                        else if(line.includes('RandomForestClassifier')){
                            map_from_line_to_label[currentLineNo] = 'training';
                            //console.log('label: training\n' + line + '\n');
                        }
                        else if(line.includes('GaussianNB')){
                            map_from_line_to_label[currentLineNo] = 'training';
                            //console.log('label: training\n' + line + '\n');
                        }
                            // else if(line.includes('CalibratedClassifierCV')){
                            //     map_from_line_to_label[currentLineNo] = 'model deployment';
                            //     //console.log('label: model deployment\n' + line + '\n');
                        // }
                        else if(line.includes('CalibratedClassifierCV')){
                            map_from_line_to_label[currentLineNo] = 'training';
                            //console.log('label: training\n' + line + '\n');
                        }
                        else if(line.includes('brier_score_loss')){
                            map_from_line_to_label[currentLineNo] = 'evaluation';
                            //console.log('label: evaluation\n' + line + '\n');
                        }
                        else if(line.includes('log_loss')){
                            map_from_line_to_label[currentLineNo] = 'evaluation';
                            //console.log('label: evaluation\n' + line + '\n');
                        }
                        else if(line.includes('fetch_lfw_people')){
                            map_from_line_to_label[currentLineNo] = 'data collection';
                            //console.log('label: data collection\n' + line + '\n');
                        }
                        else if(line.includes('PCA')){
                            map_from_line_to_label[currentLineNo] = 'feature engineering';
                            //console.log('label: feature engineering\n' + line + '\n');
                        }
                        else if(line.includes('SVC')){
                            map_from_line_to_label[currentLineNo] = 'training';
                            //console.log('label: training\n' + line + '\n');
                        }
                            // else if(line.includes('GridSearchCV')){
                            //     map_from_line_to_label[currentLineNo] = 'model deployment';
                            //     //console.log('label: model deployment\n' + line + '\n');
                        // }
                        else if(line.includes('GridSearchCV')){
                            map_from_line_to_label[currentLineNo] = 'training';
                            //console.log('label: training\n' + line + '\n');
                        }
                        else if(line.includes('fetch_20newsgroups')){
                            map_from_line_to_label[currentLineNo] = 'data collection';
                            //console.log('label: data collection\n' + line + '\n');
                        }
                        else if(line.includes('CountVectorizer')){
                            map_from_line_to_label[currentLineNo] = 'feature engineering';
                            //console.log('label: data cleaning\n' + line + '\n');
                        }
                        else if(line.includes('HashingVectorizer')){
                            map_from_line_to_label[currentLineNo] = 'feature engineering';
                            //console.log('label: data cleaning\n' + line + '\n');
                        }
                        else if(line.includes('TfidfVectorizer')){
                            map_from_line_to_label[currentLineNo] = 'feature engineering';
                            //console.log('label: data cleaning\n' + line + '\n');
                        }
                        else if(line.includes('SGDClassifier')){
                            map_from_line_to_label[currentLineNo] = 'training';
                            //console.log('label: training\n' + line + '\n');
                        }
                        else if(line.includes('MLPClassifier')){
                            map_from_line_to_label[currentLineNo] = 'training';
                            //console.log('label: training\n' + line + '\n');
                        }
                        else if(line.includes('SimpleImputer')){
                            map_from_line_to_label[currentLineNo] = 'data cleaning';
                            //console.log('label: data cleaning\n' + line + '\n');
                        }
                        else if(line.includes('OneHotEncoder')){
                            map_from_line_to_label[currentLineNo] = 'feature engineering';
                            //console.log('label: feature engineering\n' + line + '\n');
                        }
                        else if(line.includes('GradientBoostingRegressor')){
                            map_from_line_to_label[currentLineNo] = 'training';
                            //console.log('label: training\n' + line + '\n');
                        }
                        else if(line.includes('fetch_california_housing')){
                            map_from_line_to_label[currentLineNo] = 'data collection';
                            //console.log('label: data collection\n' + line + '\n');
                        }
                        else if(line.includes('StandardScaler')){
                            map_from_line_to_label[currentLineNo] = 'feature engineering';
                            //console.log('label: feature engineering\n' + line + '\n');
                        }
                        else if(line.includes('scale')){
                            map_from_line_to_label[currentLineNo] = 'feature engineering';
                            //console.log('label: feature engineering\n' + line + '\n');
                        }
                        else if(line.includes('TransformedTargetRegressor')){
                            map_from_line_to_label[currentLineNo] = 'training';
                            //console.log('label: training\n' + line + '\n');
                        }
                        else if(line.includes('make_pipeline')){
                            map_from_line_to_label[currentLineNo] = 'training';
                            //console.log('label: training\n' + line + '\n');
                        }
                        else if(line.includes('PolynomialFeatures')){
                            map_from_line_to_label[currentLineNo] = 'feature engineering';
                            //console.log('label: feature engineering\n' + line + '\n');
                        }
                        else if(line.includes('RandomForestRegressor')){
                            map_from_line_to_label[currentLineNo] = 'training';
                            //console.log('label: training\n' + line + '\n');
                        }
                        else if(line.includes('enable_hist_gradient_boosting')){
                            map_from_line_to_label[currentLineNo] = 'training';
                            //console.log('label: training\n' + line + '\n');
                        }
                        else if(line.includes('plot_partial_dependence')){
                            map_from_line_to_label[currentLineNo] = 'evaluation';
                            //console.log('label: evaluation\n' + line + '\n');
                        }
                        else if(line.includes('XGBRegressor')){
                            map_from_line_to_label[currentLineNo] = 'training';
                            //console.log('label: training\n' + line + '\n');
                        }
                        else if(line.includes('make_column_transformer')){
                            map_from_line_to_label[currentLineNo] = 'feature engineering';
                            //console.log('label: feature engineering\n' + line + '\n');
                        }
                        else if(line.includes('DecisionTreeClassifier')){
                            map_from_line_to_label[currentLineNo] = 'training';
                            //console.log('label: training\n' + line + '\n');
                        }
                        else if(line.includes('learning_curve')){
                            map_from_line_to_label[currentLineNo] = 'evaluation';
                            //console.log('label: evaluation\n' + line + '\n');
                        }
                        else if(line.includes('validation_curve')){
                            map_from_line_to_label[currentLineNo] = 'evaluation';
                            //console.log('label: evaluation\n' + line + '\n');
                        }
                        else if(line.includes('GradientBoostingClassifier')){
                            map_from_line_to_label[currentLineNo] = 'training';
                            //console.log('label: training\n' + line + '\n');
                        }
                        else if(line.includes('roc_auc_score')){
                            map_from_line_to_label[currentLineNo] = 'evaluation';
                            //console.log('label: evaluation\n' + line + '\n');
                        }
                        else if(line.includes('precision_recall_curve')){
                            map_from_line_to_label[currentLineNo] = 'evaluation';
                            //console.log('label: evaluation\n' + line + '\n');
                        }
                        else if(line.includes('BaseEstimator')){
                            map_from_line_to_label[currentLineNo] = 'training';
                            //console.log('label: training\n' + line + '\n');
                        }
                        else if(line.includes('TransformerMixin')){
                            map_from_line_to_label[currentLineNo] = 'training';
                            //console.log('label: training\n' + line + '\n');
                        }
                        else if(line.includes('clone')){
                            map_from_line_to_label[currentLineNo] = 'training';
                            //console.log('label: training\n' + line + '\n');
                        }
                        else if(line.includes('LabelBinarizer')){
                            map_from_line_to_label[currentLineNo] = 'feature engineering';
                            //console.log('label: feature engineering\n' + line + '\n');
                        }
                        else if(line.includes('LogisticRegression')){
                            map_from_line_to_label[currentLineNo] = 'training';
                            //console.log('label: training\n' + line + '\n');
                        }
                        else if(line.includes('QuantileTransformer')){
                            map_from_line_to_label[currentLineNo] = 'feature engineering';
                            //console.log('label: feature engineering\n' + line + '\n');
                        }
                        else if(line.includes('load_iris')){
                            map_from_line_to_label[currentLineNo] = 'data collection';
                            //console.log('label: data collection\n' + line + '\n');
                        }
                        else if(line.includes('Perceptron')){
                            map_from_line_to_label[currentLineNo] = 'training';
                            //console.log('label: training\n' + line + '\n');
                        }
                        else if(line.includes('make_blobs')){
                            map_from_line_to_label[currentLineNo] = 'data labeling';
                            //console.log('label: data labeling\n' + line + '\n');
                        }
                        else if(line.includes('DBSCAN')){
                            map_from_line_to_label[currentLineNo] = 'training';
                            //console.log('label: training\n' + line + '\n');
                        }
                        else if(line.includes('normalized_mutual_info_score')){
                            map_from_line_to_label[currentLineNo] = 'evaluation';
                            //console.log('label: evaluation\n' + line + '\n');
                        }
                        else if(line.includes('adjusted_rand_score')){
                            map_from_line_to_label[currentLineNo] = 'evaluation';
                            //console.log('label: evaluation\n' + line + '\n');
                        }
                        else if(line.includes('MiniBatchKMeans')){
                            map_from_line_to_label[currentLineNo] = 'training';
                            //console.log('label: training\n' + line + '\n');
                        }
                        else if(line.includes('KMeans')){
                            map_from_line_to_label[currentLineNo] = 'training';
                            //console.log('label: training\n' + line + '\n');
                        }
                        else if(line.includes('Birch')){
                            map_from_line_to_label[currentLineNo] = 'training';
                            //console.log('label: training\n' + line + '\n');
                        }
                        else if(line.includes('silhouette_score')){
                            map_from_line_to_label[currentLineNo] = 'evaluation';
                            //console.log('label: evaluation\n' + line + '\n');
                        }
                        else if(line.includes('.plot')){
                            map_from_line_to_label[currentLineNo] = 'plotting';
                            //console.log('label: plotting\n' + line + '\n');
                        }
                        else if(line.includes('.show')){
                            map_from_line_to_label[currentLineNo] = 'plotting';
                            //console.log('label: plotting\n' + line + '\n');
                        }
                        else if(line.includes('plt')){
                            map_from_line_to_label[currentLineNo] = 'plotting';
                            //console.log('label: plotting\n' + line + '\n');
                        }
                        else if(line.includes('MultinomialNB')){
                            map_from_line_to_label[currentLineNo] = 'training';
                            //console.log('label: training\n' + line + '\n');
                        }
                        else if(line.includes('BernoulliNB')){
                            map_from_line_to_label[currentLineNo] = 'training';
                            //console.log('label: training\n' + line + '\n');
                        }
                        else if(line.includes('ComplementNB')){
                            map_from_line_to_label[currentLineNo] = 'training';
                            //console.log('label: training\n' + line + '\n');
                        }
                        else if(line.includes('TfidfTransformer')){
                            map_from_line_to_label[currentLineNo] = 'feature engineering';
                            //console.log('label: feature engineering\n' + line + '\n');
                        }
                        else if(line.includes('LabelEncoder')){
                            map_from_line_to_label[currentLineNo] = 'feature engineering';
                            //console.log('label: feature engineering\n' + line + '\n');
                        }
                        else if(line.includes('ShuffleSplit')){
                            map_from_line_to_label[currentLineNo] = 'evaluation';
                            //console.log('label: evaluation\n' + line + '\n');
                        }
                        else if(line.includes('make_scorer')){
                            map_from_line_to_label[currentLineNo] = 'evaluation';
                            //console.log('label: evaluation\n' + line + '\n');
                        }
                        else if(line.includes('recall_score')){
                            map_from_line_to_label[currentLineNo] = 'evaluation';
                            //console.log('label: evaluation\n' + line + '\n');
                        }
                        else if(line.includes('roc_curve')){
                            map_from_line_to_label[currentLineNo] = 'evaluation';
                            //console.log('label: evaluation\n' + line + '\n');
                        }
                        else if(line.includes('auc')){
                            map_from_line_to_label[currentLineNo] = 'evaluation';
                            //console.log('label: evaluation\n' + line + '\n');
                        }
                        else if(line.includes('roc_auc_score')){
                            map_from_line_to_label[currentLineNo] = 'evaluation';
                            //console.log('label: evaluation\n' + line + '\n');
                        }
                        else if(line.includes('LogisticRegressionCV')){
                            map_from_line_to_label[currentLineNo] = 'training';
                            //console.log('label: training\n' + line + '\n');
                        }
                        else if(line.includes('ParameterSampler')){
                            map_from_line_to_label[currentLineNo] = 'training';
                            //console.log('label: training\n' + line + '\n');
                        }
                        else if(line.includes('RBFSampler')){
                            map_from_line_to_label[currentLineNo] = 'training';
                            //console.log('label: training\n' + line + '\n');
                        }
                        else if(line.includes('DictVectorizer')){
                            map_from_line_to_label[currentLineNo] = 'feature engineering';
                            //console.log('label: feature engineering\n' + line + '\n');
                        }
                        else if(line.includes('ParameterGrid')){
                            map_from_line_to_label[currentLineNo] = 'training';
                            //console.log('label: training\n' + line + '\n');
                        }
                        else if(line.includes('SelectFromModel')){
                            map_from_line_to_label[currentLineNo] = 'feature engineering';
                            //console.log('label: feature engineering\n' + line + '\n');
                        }
                        else if(line.includes('BernoulliRBM')){
                            map_from_line_to_label[currentLineNo] = 'training';
                            //console.log('label: training\n' + line + '\n');
                        }
                        else if(line.includes('mean_squared_error')){
                            map_from_line_to_label[currentLineNo] = 'evaluation';
                            //console.log('label: evaluation\n' + line + '\n');
                        }
                        else if(line.includes('StratifiedKFold')){
                            map_from_line_to_label[currentLineNo] = 'evaluation';
                            //console.log('label: evaluation\n' + line + '\n');
                        }
                        else if(line.includes('RFECV')){
                            map_from_line_to_label[currentLineNo] = 'feature engineering';
                            //console.log('label: feature engineering\n' + line + '\n');
                        }
                        else if(line.includes('feature_importances_')){
                            map_from_line_to_label[currentLineNo] = 'evaluation';
                            // console.log(line);
                            //console.log('label: evaluation\n' + line + '\n');
                        }
                        else if(line.includes('KNeighborsClassifier')){
                            map_from_line_to_label[currentLineNo] = 'training';
                            //console.log('label: training\n' + line + '\n');
                        }
                        else if(line.includes('KNeighborsRegressor')){
                            map_from_line_to_label[currentLineNo] = 'training';
                            //console.log('label: training\n' + line + '\n');
                        }
                        else if(line.includes('DecisionTreeRegressor')){
                            map_from_line_to_label[currentLineNo] = 'training';
                            //console.log('label: training\n' + line + '\n');
                        }
                        else if(line.includes('load_digits')){
                            map_from_line_to_label[currentLineNo] = 'data collection';
                        }
                        else if(line.includes('load_breast_cancer')){
                            map_from_line_to_label[currentLineNo] = 'data collection';
                        }
                        else if(line.includes('KFold')){
                            map_from_line_to_label[currentLineNo] = 'evaluation';
                            //console.log('label: evaluation\n' + line + '\n');
                        }
                        else if(line.includes('LeaveOneOut')){
                            map_from_line_to_label[currentLineNo] = 'evaluation';
                            //console.log('label: evaluation\n' + line + '\n');
                        }
                        else if(line.includes('BaggingClassifier')){
                            map_from_line_to_label[currentLineNo] = 'training';
                            //console.log('label: training\n' + line + '\n');
                        }
                        else if(line.includes('BaggingRegressor')){
                            map_from_line_to_label[currentLineNo] = 'training';
                            //console.log('label: training\n' + line + '\n');
                        }
                        else if(line.includes('AgglomerativeClustering')){
                            map_from_line_to_label[currentLineNo] = 'training';
                            //console.log('label: training\n' + line + '\n');
                        }
                        else if(line.includes('FeatureAgglomeration')){
                            map_from_line_to_label[currentLineNo] = 'training';
                            //console.log('label: training\n' + line + '\n');
                        }






                        // newly added labelings for pandas lib
                        else if(line.includes('read_csv')){
                            map_from_line_to_label[currentLineNo] = 'data collection';
                        }
                        else if(line.includes('read_table')){
                            map_from_line_to_label[currentLineNo] = 'data collection';
                        }
                        else if(line.includes('read_excel')){
                            map_from_line_to_label[currentLineNo] = 'data collection';
                        }
                        else if(line.includes('read_sql')){
                            map_from_line_to_label[currentLineNo] = 'data collection';
                        }
                        else if(line.includes('read_json')){
                            map_from_line_to_label[currentLineNo] = 'data collection';
                        }
                        else if(line.includes('read_html')){
                            map_from_line_to_label[currentLineNo] = 'data collection';
                        }
                        else if(line.includes('read_clipboard')){
                            map_from_line_to_label[currentLineNo] = 'data collection';
                        }
                        else if(line.includes('Datarame')){
                            map_from_line_to_label[currentLineNo] = 'data collection';
                        }
                        else if(line.includes('.DatetimeIndex')){
                            map_from_line_to_label[currentLineNo] = 'data collection';
                        }
                        else if(line.includes('.DataFrame')){
                            map_from_line_to_label[currentLineNo] = 'data collection';
                        }
                        else if(line.includes('.head')){
                            map_from_line_to_label[currentLineNo] = 'data exploration';
                        }
                        else if(line.includes('.tail')){
                            map_from_line_to_label[currentLineNo] = 'data exploration';
                        }
                        else if(line.includes('.shape')){
                            map_from_line_to_label[currentLineNo] = 'data exploration';
                        }
                        else if(line.includes('.info')){
                            map_from_line_to_label[currentLineNo] = 'data exploration';
                        }
                        else if(line.includes('.describe')){
                            map_from_line_to_label[currentLineNo] = 'data exploration';
                        }
                        else if(line.includes('.value_counts')){
                            map_from_line_to_label[currentLineNo] = 'data exploration';
                        }
                        else if(line.includes('.apply')){
                            map_from_line_to_label[currentLineNo] = 'data exploration';
                        }
                        else if(line.includes('.loc')){
                            map_from_line_to_label[currentLineNo] = 'data exploration';
                        }
                        else if(line.includes('.iloc')){
                            map_from_line_to_label[currentLineNo] = 'data exploration';
                        }
                        else if(line.includes('.columns')){
                            map_from_line_to_label[currentLineNo] = 'data cleaning';
                        }
                        else if(line.includes('.isnull')){
                            map_from_line_to_label[currentLineNo] = 'data cleaning';
                        }
                        else if(line.includes('.notnull')){
                            map_from_line_to_label[currentLineNo] = 'data cleaning';
                        }
                        else if(line.includes('.dropna')){
                            map_from_line_to_label[currentLineNo] = 'data cleaning';
                        }
                        else if(line.includes('.fillna')){
                            map_from_line_to_label[currentLineNo] = 'data cleaning';
                        }
                        else if(line.includes('.astype')){
                            map_from_line_to_label[currentLineNo] = 'data cleaning';
                        }
                            // else if(line.includes('.replace')){
                            //     map_from_cell_to_labels[cell.execution_count].add('data cleaning');
                            //     map_from_label_to_line_nums['data cleaning'] += 1;
                        // }
                        else if(line.includes('.rename')){
                            map_from_line_to_label[currentLineNo] = 'data cleaning';
                        }
                        else if(line.includes('.set_index')){
                            map_from_line_to_label[currentLineNo] = 'data cleaning';
                        }
                        else if(line.includes('.sort_values')){
                            map_from_line_to_label[currentLineNo] = 'data exploration';
                        }
                        else if(line.includes('.groupby')){
                            map_from_line_to_label[currentLineNo] = 'data exploration';
                        }
                        else if(line.includes('.pivot_table')){
                            map_from_line_to_label[currentLineNo] = 'data exploration';
                        }
                            // else if(line.includes('.append')){
                            //     map_from_cell_to_labels[cell.execution_count].add('data exploration');
                            //     map_from_label_to_line_nums['data exploration'] += 1;
                        // }
                        else if(line.includes('pd.concat')){
                                map_from_line_to_label[currentLineNo] = 'data exploration';
                            }
                    }


                    if(currentLineNo in map_from_line_to_label){
                        if(map_from_line_to_label[currentLineNo] == 'data collection'){
                            res_color_map += (cell.execution_count + '->' + 'red' + '\n');
                        }
                        else if(map_from_line_to_label[currentLineNo] == 'data cleaning'){
                            res_color_map += (cell.execution_count + '->' + 'yellow' + '\n');
                        }
                        else if(map_from_line_to_label[currentLineNo] == 'data labeling'){
                            res_color_map += (cell.execution_count + '->' + 'green' + '\n');
                        }
                        else if(map_from_line_to_label[currentLineNo] == 'feature engineering'){
                            res_color_map += (cell.execution_count + '->' + 'blue' + '\n');
                        }
                        else if(map_from_line_to_label[currentLineNo] == 'training'){
                            res_color_map += (cell.execution_count + '->' + 'purple' + '\n');

                        }
                        else if(map_from_line_to_label[currentLineNo] == 'evaluation'){
                            res_color_map += (cell.execution_count + '->' + 'orange' + '\n');
                        }
                            // else if(map_from_line_to_label[currentLineNo] == 'model deployment'){
                            //     res_color_map += (cell.execution_count + '->' + 'pink' + '\n');
                        // }
                        else if(map_from_line_to_label[currentLineNo] == 'plotting'){
                            res_color_map += (cell.execution_count + '->' + 'lightblue' + '\n');
                        }
                        else if(map_from_line_to_label[currentLineNo] == 'data exploration'){
                            res_color_map += (cell.execution_count + '->' + 'pink' + '\n');
                        }

                    }

                    currentLineNo += 1;
                }


                notebookCode += sourceCode + '\n';

                let cellLength = cell.source.length;
                cell.lineNos = [currentLine, currentLine + cellLength - 1];
                cell.dependentOn = [];
                cell.cfgdependentOn = [];

                currentLine += cellLength;
                cells.push(cell);
                dict[cell.execution_count] = cell;
            }
        }

        const flows = utils.getDefUse(notebookCode);

        for (let flow of flows.items) {
            if((py.printNode(flow.toNode) != undefined) &&(py.printNode(flow.toNode)).includes('.fit')){

                let toNode_cell = 0;
                let toNodeLineNo = flow.toNode.location.first_line - 1;

                for(let cell of cells){
                    if (utils.isInCellBoundaries(toNodeLineNo, cell.lineNos)){
                        toNode_cell = cell.execution_count;
                        break;
                    }
                }

                let fromNodeLineNo = flow.fromNode.location.first_line - 1;

                if(fromNodeLineNo in map_from_line_to_label && map_from_line_to_label[fromNodeLineNo] == 'training'){
                    for(let cell of cells){
                        if (utils.isInCellBoundaries(fromNodeLineNo, cell.lineNos)){
                            res_color_map += (toNode_cell + '->' + 'purple' + '\n');
                            break;
                        }
                    }
                }

                if(fromNodeLineNo in map_from_line_to_label && map_from_line_to_label[fromNodeLineNo] == 'feature engineering'){
                    for(let cell of cells){
                        if (utils.isInCellBoundaries(fromNodeLineNo, cell.lineNos)){
                            res_color_map += (toNode_cell + '->' + 'blue' + '\n');
                            break;
                        }
                    }
                }

            }
        }
    return res_color_map;

    }
}

