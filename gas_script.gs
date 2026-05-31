// ─── Google Apps Script for Economic Decision-Making Study (v22+) ────────────
// HOW TO DEPLOY:
//   1. Go to script.google.com → open this project
//   2. Replace all existing code with this file
//   3. Save (Ctrl+S)
//   4. Click Deploy → Manage Deployments → New Deployment
//      Type: Web app | Execute as: Me | Who has access: Anyone
//   5. Copy the new /exec URL and paste it into study_v22.html as SHEETS_ENDPOINT
//
// The script writes one row per participant. Row 1 must contain the headers
// listed in HEADERS below — copy them exactly into your sheet's first row.
// ─────────────────────────────────────────────────────────────────────────────

var SHEET_NAME = 'Responses'; // change if your sheet tab has a different name

var HEADERS = [
  // Identity
  'participantId', 'sessionStart', 'sessionEnd',
  // Prescreening
  'countryOfOrigin', 'isBSEStudent', 'fictitiousName',
  // Background survey → society assignment
  'institutionalTrust', 'fundManagement', 'perceivedCorruption',
  'correctedMedian', 'correctedMean',
  // Treatment assignment
  'society', 'normVal', 'friendTreatment',
  // Declaration decisions (% of income declared)
  'r1_pct', 'r2_pct', 'r3_pct', 'r4_pct',
  'delta_r2_r1_pp', 'delta_r3_r2_pp', 'delta_r4_r3_pp',
  // Treatment decision times (seconds from screen shown → Revise/Keep click)
  'desc_norm_decision_s', 'presc_norm_decision_s', 'friend_story_decision_s',
  // Total seconds on each screen (accumulated across back-navigation)
  'r1_total_s', 'desc_norm_total_s', 'r2_total_s',
  'presc_norm_total_s', 'r3_total_s', 'friend_story_total_s', 'r4_total_s',
  // Revision choices (change / keep)
  'desc_norm_revision', 'presc_norm_revision', 'friend_revision',
  // Audit outcome
  'wasAudited', 'finalDeclaredPct', 'taxPaid', 'undeclaredTax', 'fine', 'finalSavings',
  // Demographics
  'gender', 'age', 'hasPaidTaxes',
  'knowsSomeoneAudited', 'auditOutcome', 'knowsSomeoneEvaded',
  'moralWrongnessScore',
  'evasionEstimatePercent', 'auditLikelihoodPercent',
  'lotteryFirstSwitch', 'fieldOfStudy',
  // Free text
  'generalComments'
];

function doPost(e) {
  try {
    var raw  = e.parameter.data;
    var data = JSON.parse(raw);

    // Safe accessor: reads a dot-path like "decisions.r1_baseline"
    function get(obj, path) {
      return path.split('.').reduce(function(o, k) {
        return (o != null && o[k] !== undefined) ? o[k] : null;
      }, obj);
    }

    // Map every header to its value in the JSON.
    // Fields hoisted to top level in v22 are found immediately;
    // nested paths are resolved by the dot-notation accessor.
    var fieldMap = {
      // Identity
      participantId:           get(data, 'participantId'),
      sessionStart:            get(data, 'sessionStart'),
      sessionEnd:              get(data, 'sessionEnd'),
      // Prescreening
      countryOfOrigin:         get(data, 'prescreening.countryOfOrigin'),
      isBSEStudent:            get(data, 'prescreening.isBSEStudent'),
      fictitiousName:          get(data, 'prescreening.fictitiousName'),
      // Background survey
      institutionalTrust:      get(data, 'backgroundSurvey.institutionalTrust'),
      fundManagement:          get(data, 'backgroundSurvey.fundManagement'),
      perceivedCorruption:     get(data, 'backgroundSurvey.perceivedCorruption'),
      correctedMedian:         get(data, 'backgroundSurvey.correctedMedian'),
      correctedMean:           get(data, 'backgroundSurvey.correctedMean'),
      // Treatment assignment
      society:                 get(data, 'treatments.society'),
      normVal:                 get(data, 'treatments.norm'),
      friendTreatment:         get(data, 'treatments.friendCounterExample'),
      // Decisions
      r1_pct:                  get(data, 'decisions.r1_baseline'),
      r2_pct:                  get(data, 'decisions.r2_afterDescriptive'),
      r3_pct:                  get(data, 'decisions.r3_afterPrescriptive'),
      r4_pct:                  get(data, 'decisions.r4_afterFriendStory'),
      delta_r2_r1_pp:          get(data, 'decisions.delta_r2_minus_r1'),
      delta_r3_r2_pp:          get(data, 'decisions.delta_r3_minus_r2'),
      delta_r4_r3_pp:          get(data, 'decisions.delta_r4_minus_r3'),
      // Treatment decision times — top-level in v22
      desc_norm_decision_s:    get(data, 'desc_norm_decision_s'),
      presc_norm_decision_s:   get(data, 'presc_norm_decision_s'),
      friend_story_decision_s: get(data, 'friend_story_decision_s'),
      // Screen totals — top-level in v22
      r1_total_s:              get(data, 'r1_total_s'),
      desc_norm_total_s:       get(data, 'desc_norm_total_s'),
      r2_total_s:              get(data, 'r2_total_s'),
      presc_norm_total_s:      get(data, 'presc_norm_total_s'),
      r3_total_s:              get(data, 'r3_total_s'),
      friend_story_total_s:    get(data, 'friend_story_total_s'),
      r4_total_s:              get(data, 'r4_total_s'),
      // Revision choices
      desc_norm_revision:      get(data, 'responseTimings.perQuestion.r2_revision_choice.value'),
      presc_norm_revision:     get(data, 'responseTimings.perQuestion.r3_revision_choice.value'),
      friend_revision:         get(data, 'responseTimings.perQuestion.r4_revision_choice.value'),
      // Audit
      wasAudited:              get(data, 'audit.wasAudited'),
      finalDeclaredPct:        get(data, 'audit.finalPct'),
      taxPaid:                 get(data, 'audit.taxPaid'),
      undeclaredTax:           get(data, 'audit.undeclaredTax'),
      fine:                    get(data, 'audit.fine'),
      finalSavings:            get(data, 'audit.finalSavings'),
      // Demographics
      gender:                  get(data, 'finalQuestions.gender'),
      age:                     get(data, 'finalQuestions.age'),
      hasPaidTaxes:            get(data, 'finalQuestions.hasPaidTaxes'),
      knowsSomeoneAudited:     get(data, 'finalQuestions.knowsSomeoneAudited'),
      auditOutcome:            get(data, 'finalQuestions.auditOutcome'),
      knowsSomeoneEvaded:      get(data, 'finalQuestions.knowsSomeoneWhoEvaded'),
      moralWrongnessScore:     get(data, 'finalQuestions.moralWrongnessScore'),
      // Evasion + audit likelihood — top-level in v22 (also in finalQuestions)
      evasionEstimatePercent:  get(data, 'evasionEstimatePercent') !== null
                                 ? get(data, 'evasionEstimatePercent')
                                 : get(data, 'finalQuestions.evasionEstimatePercent'),
      auditLikelihoodPercent:  get(data, 'auditLikelihoodPercent') !== null
                                 ? get(data, 'auditLikelihoodPercent')
                                 : get(data, 'finalQuestions.perceivedAuditLikelihood'),
      lotteryFirstSwitch:      get(data, 'finalQuestions.lotteryFirstSwitch'),
      fieldOfStudy:            get(data, 'finalQuestions.fieldOfStudyOrProfession'),
      // Comments — top-level in v22 (also in finalQuestions)
      generalComments:         get(data, 'generalComments') !== null
                                 ? get(data, 'generalComments')
                                 : get(data, 'finalQuestions.generalComments')
    };

    var ss    = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName(SHEET_NAME) || ss.getActiveSheet();

    // Write header row if the sheet is empty
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(HEADERS);
    }

    // Build row in header order so columns always align
    var row = HEADERS.map(function(h) {
      var v = fieldMap[h];
      return (v === null || v === undefined) ? '' : v;
    });

    sheet.appendRow(row);

    return ContentService
      .createTextOutput(JSON.stringify({status: 'ok', rows: sheet.getLastRow()}))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    // Log the error so you can inspect it in Apps Script → Executions
    console.error('doPost error:', err.toString());
    return ContentService
      .createTextOutput(JSON.stringify({status: 'error', message: err.toString()}))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// Allows a quick browser test of the endpoint URL
function doGet(e) {
  return ContentService.createTextOutput('Study data endpoint is live.');
}
