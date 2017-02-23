(function($, he) {
  var billTrackerElem = document.getElementById('usaBillTrackerData');
  var billTrackerData = $(billTrackerElem).text();
  billTrackerData = $('<div/>').html(billTrackerData).text();
  billTrackerData = JSON.parse(billTrackerData);

  if (localStorage) {
    var currentSearch = billTrackerData.currentSearch;
    var recentSearches = localStorage.getItem('recentSearches');
    recentSearches = recentSearches ? JSON.parse(recentSearches) : [];

    if (recentSearches.length) {
      var $recentSearchesContainer = $('#recent-searches');
      $recentSearchesContainer.show();

      $.each(recentSearches, function(key, searchString) {
        var searchParams = JSON.parse(searchString);

        var $searchLink = $('<a>');
        var searchLinkQuery = '?';
        searchLinkQuery += $.param(searchParams);
        $searchLink.attr('href', searchLinkQuery);

        var searchDesc = '';
        if (searchParams.query) {
          searchDesc += 'Query: "' + searchParams.query + '"';
        }
        if (searchParams.congress && searchParams.congress.length) {
          searchDesc += ', Congress: ' + searchParams.congress.join(',');
        }
        if (searchParams.billType && searchParams.billType.length) {
          searchDesc += ', Bill type: ' + searchParams.billType.join(',');
        }

        $searchLink.html(searchDesc);

        $recentSearchesContainer.append($searchLink);
      });
    }

    if (currentSearch && Object.keys(currentSearch).length) {
      var currentSearchString = JSON.stringify(currentSearch);
      if (recentSearches.indexOf(currentSearchString) == -1) {
        recentSearches.unshift(currentSearchString);
        if (recentSearches.length > 5) {
          recentSearches.pop();
        }
      }
    }

    localStorage.setItem('recentSearches', JSON.stringify(recentSearches));
  }

  var $billSearchForm = $('#billSearchForm');

  // $billSearchForm.on('submit', function(event) {
  //   // Stop default form submit behavior so we can
  //   // handle via AJAX.
  //   event.preventDefault();

  //   // Submit the bill search form.
  //   submitBillSearchForm();
  // });

  // Submit the bill search form via AJAX.
  function submitBillSearchForm() {
    $.ajax({
      type: 'POST',
      url: $billSearchForm.attr('action'),
      data: $billSearchForm.serialize(), // Serialize form data.
      success: function(data) {
        // Get the HTML of the results from the search.
        var resultsHTML = $(data).find('#bill-results').html();
        // Place the results of the search on the page.
        $('#bill-results').html(resultsHTML);
      }
    });
  }

  // Activate search options from certain
  // links on the page.
  $('.bill-info--tag').click(function(event) {
    event.preventDefault();
    var optionId = $(this).attr('data-option-id');
    $('#' + optionId).attr('checked', 'checked');
  });
})(jQuery, he);
