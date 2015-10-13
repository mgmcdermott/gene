var React = require('react-native');
var libInfo = require('./libInfo');
var LibraryList = require('./LibraryList');
var NavBar = require('./NavBar');
var StyleVars = require('./StyleVars');

var {
  colorBackground,
  colorBorderTop,
  colorBorderSide,
  colorBorderBottom,
  colorPrimaryDark,
  colorGray,
  colorGrayDark,
  fontFamily,
} = StyleVars;

var {
  Dimensions,
  Image,
  ListView,
  PixelRatio,
  StyleSheet,
  Text,
  TextInput,
  TouchableHighlight,
  TouchableOpacity,
  View,
} = React;

var lastResult = [];
var windowDim = Dimensions.get('window');
var smallHeight = windowDim.width < 325;

var Results = React.createClass({
  propTypes: {
    gene: React.PropTypes.string,
    useLastResult: React.PropTypes.bool,
  },
  getInitialState: function() {
    return {
      networkError: false,
      categoryDataSrc: new ListView.DataSource({
        rowHasChanged: (row1, row2) => row1 !== row2
      }),
    };
  },
  componentWillMount: function() {
    if (this.props.useLastResult) {
      this.setState({
        categoryDataSrc: this.state.categoryDataSrc.cloneWithRows(lastResult)
      });
    } else {
      this._getGSLibraries(this.props.gene);
    }
  },
  render: function() {
    if (this.state.networkError) {
      return (
        <View style={styles.errorWrapper}>
          <Image
            source={require('image!hazard')}
            resizeMode={'contain'}
            style={styles.errorIcon}
          />
          <Text style={styles.errorText}>No Network Connection</Text>
          <TouchableOpacity
            style={styles.errorButton}
            onPress={() => { this._getGSLibraries(this.props.gene); }}>
            <Text style={styles.bold}>Try Again?</Text>
          </TouchableOpacity>
        </View>
      );
    } else {
      return (
        <ListView
          dataSource={this.state.categoryDataSrc}
          renderRow={this._renderCategories}
          style={styles.listView}
          contentContainerStyle={styles.listViewContainer}
          automaticallyAdjustContentInsets={false}
        />
      );
    }
  },
  _renderCategories: function(catObj) {
    var icons = {
      'Cell Types': require('image!cell_types'),
      Crowd: require('image!crowd'),
      'Disease/Drugs': require('image!drugs'),
      Legacy: require('image!legacy'),
      Misc: require('image!misc'),
      Ontologies: require('image!ontologies'),
      Pathways: require('image!pathways'),
      Transcription: require('image!dna'),
    };
    return (
      <View style={styles.rowWrapper}>
        <TouchableHighlight onPress={() => this._goToLibraries(catObj)}>
          <View style={styles.rowInner}>
            <Image
                source={icons[catObj.type]}
                resizeMode={'contain'}
                style={styles.optionIcon}
              />
            <Text style={styles.option}>
              {catObj.type}
            </Text>
          </View>
        </TouchableHighlight>
      </View>
    );
  },
  _goToLibraries: function(categoryObj) {
    this.props.navigator.push({
      name: 'Library List',
      component: LibraryList,
      passProps: {
        gene: this.props.gene,
        categoryName: categoryObj.type,
        libraries: categoryObj.libraries,
      },
      navigationBar: (
        <NavBar
          gene={this.props.gene}
          category={categoryObj.type}
        />
      )
    });
  },
  _getGSLibraries: function(inputGene) {
    var _this = this;
    // var datasetsUrl = 'http://amp.pharm.mssm.edu/Enrichr/datasetStatistics';
    var termsUrl = 'http://amp.pharm.mssm.edu/Enrichr/genemap?gene=' +
      inputGene + '&setup=true&json=true&_=1442611548980';
    fetch(termsUrl)
      .then((tResponse) => tResponse.json())
      .then((termsResp) => {
        // Transform response object to array of objects with keys as values in
        // object
        var data = [];
        termsResp.categories.forEach(function(catObj) {
          var newLib = {
            type: catObj.name,
            libraries: []
          };
          catObj.libraries.forEach(function(categoryObj) {
            for (var libraryName in termsResp.gene) {
              if (termsResp.gene.hasOwnProperty(libraryName)) {
                if (categoryObj.name === libraryName) {
                  var name = libraryName.replace(/_/g, ' ');
                  var description = libInfo[name]
                    .description
                    .replace(/\{0\}/, _this.props.gene);
                  categoryObj.name = name;
                  categoryObj.terms = termsResp.gene[libraryName];
                  categoryObj.description = description;
                  newLib.libraries.push(categoryObj);
                }
              }
            }
          });
          if (newLib.libraries.length) {
            data.push(newLib);
          }
        });
        lastResult = data;
        _this.setState({
          networkError: false,
          categoryDataSrc: this.state.categoryDataSrc.cloneWithRows(data)
        });
      })
      .catch((err) => {
        _this.setState({ networkError: true });
      })
      .done();
  }
});

var styles = StyleSheet.create({
  bold: {
    fontFamily: fontFamily,
    fontWeight: 'bold',
  },
  errorIcon: {
    height: 42,
    width: 60,
  },
  errorWrapper: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorButton: {
    backgroundColor: 'white',
    marginTop: 10,
    borderRadius: 5,
    padding: 15,
    paddingLeft: 30,
    paddingRight: 30,
    borderWidth: 1,
    borderColor: colorBorderSide,
    borderTopColor: colorBorderTop,
    borderBottomColor: colorBorderBottom,
  },
  errorText: {
    fontFamily: fontFamily,
    marginTop: 5,
  },
  listView: {
    backgroundColor: colorBackground,
    paddingLeft: 5,
    paddingRight: 5,
    paddingBottom: 5,
  },
  listViewContainer: {
    marginBottom: 5,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    backgroundColor: colorBackground,
  },
  option: {
    marginTop: 10,
    fontFamily: fontFamily,
    fontSize: 16,
    fontWeight: 'bold',
  },
  optionIcon: {
    height: 100,
    width: 100,
  },
  rowWrapper: {
    marginTop: 5,
    height: 155,
    width: (windowDim.width - 11) / 2,
    marginBottom: 10,
  },
  rowInner: {
    borderWidth: 1,
    borderRadius: 3,
    borderColor: colorBorderSide,
    borderTopColor: colorBorderTop,
    borderBottomColor: colorBorderBottom,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
    padding: 10,
    paddingTop: 20,
  }
});


module.exports = Results;
