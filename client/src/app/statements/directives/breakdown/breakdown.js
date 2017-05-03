angular.module('statements')

  .directive('statementBreakdown', function () {
    return {
      "restrict": 'E',
      "scope": {
        "breakdown": '='
      },
      "templateUrl": '/app/statements/directives/breakdown/breakdown.template.html'
    };
  })

  .directive('breakdownPopover', function () {
    return {
      "restrict": 'A',
      "scope": {
        "item": '='
      },
      "link": function (scope, element, attrs) {
        var item = scope.item;
        $(element).popover({
          'animation': false,
          //'varraints': [{ 'to': 'window', 'pin': ['left', 'right'] }], // fixes window overflow, but arrow is misaligned
          'container': 'body',
          'content': function () {

            var val;
            if ((item.phrase !== undefined) && (item.phrase !== null)) {
              val = item.phrase;
            } else if ((item.word !== undefined) && (item.word !== null)) {
              val = item.word;
            } else {
              return false;
            }

            var classification = '<span class="text-muted">Unknown</span>';
            if (val.classification && val.classification.length) {
              classification = '<span class="text-capitalize">' + val.classification.join(', ') + '</span>';
            }

            var points = '<span class="text-muted">N/A</span>';
            if (item.points !== undefined) {
              points = item.points;
              if ((val.points !== undefined) && (val.points !== null)) {
                points += ' <small class="text-muted">(out of ' + val.points + ')</small>';
              }
            }

            var uses = val.uses || 0;

            var content = '<dl class="row">';

            // this is only when analyzing a statement prior to submission
            // submitted statements are always valid, so showing the validation indicator is unnecessary
            if (item.valid !== undefined) {
              content += '<dt class="col-6">Is Valid</dt>';
              content += '<dd class="col-6">';
              if (item.valid) {
                content += '<span class="text-success">Yes <i class="fa fa-check"></i></span>';
              } else {
                content += '<span class="text-danger">No <i class="fa fa-ban"></i>';
                if (item.error) {
                  content += '<br/><span class="text-capitalize">' + item.error + '</span>';
                }
                content += '</span>';
              }
              content += '</dd >';
            }

            content += '<dt class="col-6">Classification(s)</dt><dd class="col-6">' + classification + '</dd>';
            content += '<dt class="col-6">Points Awarded</dt><dd class="col-6">' + points + '</dd>';
            content += '<dt class="col-6">Total Uses</dt><dd class="col-6">' + uses + '</dd>';

            content += '</dl>';

            return content;
          },
          'html': true,
          'placement': 'top',
          'title': function () {

            var type = 'Unknown Type';
            var value = 'Unknown Value';
            if ((item.phrase !== undefined) && (item.phrase !== null)) {
              type = 'Phrase';
              value = item.phrase.value;
            } else if ((item.word !== undefined) && (item.word !== null)) {
              type = 'Word';
              value = item.word.value;
            }

            var color = 'text-primary';
            if (item.valid !== undefined) {
              color = (item.valid) ? 'text-success' : 'text-danger';
            }

            return '<span>' + type + '</span>: <span class="text-capitalize ' + color + '">' + value + '</span>';
          },
          'trigger': 'hover focus'
        });
      }
    };
  })

