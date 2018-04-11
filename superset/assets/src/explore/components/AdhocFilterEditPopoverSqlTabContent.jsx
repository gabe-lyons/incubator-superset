import React from 'react';
import PropTypes from 'prop-types';
import AceEditor from 'react-ace';
import 'brace/mode/sql';
import 'brace/theme/github';
import 'brace/ext/language_tools';
import { FormGroup, Tab } from 'react-bootstrap';

import { sqlWords } from '../../SqlLab/components/AceEditorWrapper';
import AdhocFilter, { EXPRESSION_TYPES, CLAUSES } from '../AdhocFilter';
import adhocMetricType from '../propTypes/adhocMetricType';
import columnType from '../propTypes/columnType';
import OnPasteSelect from '../../components/OnPasteSelect';
import VirtualizedRendererWrap from '../../components/VirtualizedRendererWrap';
import VirtualizedSelect from 'react-virtualized-select';
import { t } from '../../locales';

const propTypes = {
  adhocFilter: PropTypes.instanceOf(AdhocFilter).isRequired,
  onChange: PropTypes.func.isRequired,
  options: PropTypes.arrayOf(PropTypes.oneOfType([
    columnType,
    PropTypes.shape({ saved_metric_name: PropTypes.string.isRequired }),
    adhocMetricType,
  ])).isRequired,
  height: PropTypes.number.isRequired,
};

const langTools = ace.acequire('ace/ext/language_tools');

export default class AdhocFilterEditPopoverSqlTabContent extends React.Component {
  constructor(props) {
    super(props);
    this.onSqlExpressionChange = this.onSqlExpressionChange.bind(this);
    this.onSqlExpressionClauseChange = this.onSqlExpressionClauseChange.bind(this);

    this.selectProps = {
      multi: false,
      name: 'select-column',
      labelKey: 'label',
      autosize: false,
      clearable: false,
      selectWrap: VirtualizedSelect,
    };

    if (langTools) {
      const words = sqlWords.concat(this.props.options.map(option => {
        if (option.column_name) {
          return { name: option.column_name, value: option.column_name, score: 50, meta: 'option' };
        }
      }));
      const completer = {
        getCompletions: (aceEditor, session, pos, prefix, callback) => {
          callback(null, words);
        },
      };
      langTools.setCompleters([completer]);
    }
  }

  onSqlExpressionClauseChange(clause) {
    this.props.onChange(this.props.adhocFilter.duplicateWith({
      clause: clause && clause.clause,
      expressionType: EXPRESSION_TYPES.SQL,
    }));
  }

  onSqlExpressionChange(sqlExpression) {
    this.props.onChange(this.props.adhocFilter.duplicateWith({
      sqlExpression,
      expressionType: EXPRESSION_TYPES.SQL,
    }));
  }

  render() {
    const { adhocFilter, options, height } = this.props;

    const clauseSelectProps = {
      placeholder: t('choose WHERE or HAVING...'),
      options: Object.keys(CLAUSES).map(clause => ({ clause })),
      value: adhocFilter.clause,
      onChange: this.onSqlExpressionClauseChange,
      optionRenderer: VirtualizedRendererWrap(clause => clause.clause),
      valueRenderer: clause => <span>{clause.clause}</span>,
      valueKey: 'clause',
    };
    
    return (
      <span>
        <FormGroup className="filter-edit-clause-section">
          <OnPasteSelect
            {...this.selectProps}
            {...clauseSelectProps}
            className="filter-edit-clause-dropdown"
          />
          <span className="filter-edit-clause-info">
            <strong>Where</strong> filters by columns.&nbsp;
            <strong>Having</strong> filters by metrics.
          </span>
        </FormGroup>
        <FormGroup>
          <AceEditor
            mode="sql"
            theme="github"
            height={(height - 90) + 'px'}
            onChange={this.onSqlExpressionChange}
            width="100%"
            showGutter={false}
            value={adhocFilter.sqlExpression || adhocFilter.translateToSql()}
            editorProps={{ $blockScrolling: true }}
            enableLiveAutocompletion
          />
        </FormGroup>
      </span>
    );
  }
}
AdhocFilterEditPopoverSqlTabContent.propTypes = propTypes;
