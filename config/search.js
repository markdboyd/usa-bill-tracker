module.exports = {
  resultsPerPage: 25,
  fields: [
    'bill_id',
    'bill_type',
    'number',
    'congress',
    'introduced_on',
    'short_title',
    'last_action_at',
    'last_action',
    'summary_short',
    'urls.congress'
  ],
  billStatusConditions: {
    'introduced': {
      'history.house_passage_result__exists': 'false'
    },
    'passed_house': {
      'history.house_passage_result': 'pass',
      'history.senate_passage_result__exists': 'false'
    },
    'passed_senate': {
      'history.senate_passage_result': 'pass',
      'history.awaiting_signature': 'false',
      'history.enacted': 'false'
    },
    'to_president': {
      'history.house_passage_result': 'pass',
      'history.senate_passage_result': 'pass',
      'history.awaiting_signature': 'true',
      'history.enacted': 'false'
    },
    'enacted': {
      'history.enacted': 'true'
    }
  }
}
