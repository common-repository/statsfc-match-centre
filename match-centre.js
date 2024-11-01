/* global statsfc_lang */

var $j = jQuery;

function StatsFC_MatchCentre (key) {
  this.referer = '';
  this.key = key;
  this.team = '';
  this.date = '';
  this.timezone = '';
  this.omitErrors = false;
  this.useDefaultCss = true;
  this.lang = 'en';

  this.translate = function (key, replacements) {
    var translation;

    if (
      typeof statsfc_lang === 'undefined' ||
      typeof statsfc_lang[key] === 'undefined' ||
      statsfc_lang[key].length === 0
    ) {
      translation = key;
    } else {
      translation = statsfc_lang[key];
    }

    if (typeof replacements === 'object') {
      for (var name in replacements) {
        translation = translation.replace('{' + name + '}', replacements[name]);
      }
    }

    return translation;
  };

  this.display = function (placeholder) {
    this.loadLang('statsfc-lang', this.lang);

    var $placeholder;

    switch (typeof placeholder) {
      case 'string':
        $placeholder = $j('#' + placeholder);
        break;
      case 'object':
        $placeholder = placeholder;
        break;
      default:
        return;
    }

    if ($placeholder.length === 0) {
      return;
    }

    if (this.useDefaultCss === true || this.useDefaultCss === 'true') {
      this.loadCss('statsfc-match-centre-css');
    }

    if (typeof this.referer !== 'string' || this.referer.length === 0) {
      this.referer = window.location.hostname;
    }

    var $container = $j('<div>').addClass('sfc_matchcentre');

    // Store globals variables here so we can use it later
    var omitErrors = (this.omitErrors === true || this.omitErrors === 'true');
    var obj = this;

    $j.getJSON(
      'https://widgets.statsfc.com/api/match-centre.json?callback=?',
      {
        key: this.key,
        domain: this.referer,
        team: this.team,
        date: this.date,
        timezone: this.timezone,
        lang: this.lang,
      },
      function (data) {
        if (data.error) {
          if (omitErrors) {
            return;
          }

          var $error = $j('<p>').css('text-align', 'center');

          if (data.customer && data.customer.attribution) {
            $error.append(
              $j('<a>').attr({
                href: 'https://statsfc.com',
                title: 'Football widgets and API',
                target: '_blank',
              }).text('Stats FC'),
              ' – ',
            );
          }

          $error.append(obj.translate(data.error));

          $container.append($error);

          return;
        }

        var $summary = $j('<table>').addClass('sfc_summary').append(
          $j('<tbody>').append(
            $j('<tr>').append(
              $j('<td>').addClass('sfc_badge sfc_home sfc_badge_' + data.match.home.path).append(
                $j('<img>').attr({
                  src: 'https://cdn.statsfc.com/kit/' + data.match.home.shirt,
                  width: 50,
                  height: 50,
                }),
              ),
              $j('<td>').addClass('sfc_team sfc_home').text(data.match.home.full),
              $j('<td>').addClass('sfc_score').text(data.match.score[0]),
              $j('<td>').addClass('sfc_status').text(obj.translate(data.match.status)),
              $j('<td>').addClass('sfc_score').text(data.match.score[1]),
              $j('<td>').addClass('sfc_team sfc_away').text(data.match.away.full),
              $j('<td>').addClass('sfc_badge sfc_away sfc_badge_' + data.match.home.path).append(
                $j('<img>').attr({
                  src: 'https://cdn.statsfc.com/kit/' + data.match.away.shirt,
                  width: 50,
                  height: 50,
                }),
              ),
            ),
          ),
        );

        var $timeline = $j('<div>').addClass('sfc_timelines').append(
          obj.getTimelineHtml(data.match.events, data.match.minutes, data.match.home.id, 'top', obj),
          obj.getTimelineAnnotationsHtml(data.match.minutes),
          obj.getTimelineHtml(data.match.events, data.match.minutes, data.match.away.id, 'bottom', obj),
        );

        var $starters = obj.getPlayersHtml(
          obj.translate('Starting 11'),
          data.match.squads.home.starting,
          data.match.squads.away.starting,
          data.match.events,
          obj,
        );

        var $subs = obj.getPlayersHtml(
          obj.translate('Substitutes'),
          data.match.squads.home.sub,
          data.match.squads.away.sub,
          data.match.events,
          obj,
        );

        $container.append(
          $summary,
          $timeline,
          $starters,
          $subs,
        );

        if (data.customer.attribution) {
          $container.append(
            $j('<div>').attr('class', 'sfc_footer').append(
              $j('<p>').append(
                $j('<small>').append('Powered by ').append(
                  $j('<a>').attr({
                    href: 'https://statsfc.com',
                    title: 'StatsFC – Football widgets',
                    target: '_blank',
                  }).text('StatsFC.com'),
                ),
              ),
            ),
          );
        }
      },
    );

    $placeholder.append($container);
  };

  this.getTimelineHtml = function (events, minutes, team_id, tooltipPosition, parent) {
    var goal, card, sub, index, goalType, goalTypeClass, eventTime, position;

    var tooltipSettings = {
      position: tooltipPosition,
      size: 'small',
      background: '#222222',
      color: '#F0F0F0',
      width: 'auto',
    };

    var $html = $j('<div>').addClass('sfc_timeline');

    for (index in events.goals) {
      goal = events.goals[index];

      if (goal.team_id !== team_id) {
        continue;
      }

      goalType = goal.type;
      goalTypeClass = '';

      if (goalType !== null && goalType.length > 0) {
        goalTypeClass = 'sfc_' + goalType;
      }

      eventTime = parseInt(goal.minute.replace(/[^\d]*$/, ''));
      position = (100 / minutes * eventTime);

      $html.append(
        $j('<i>')
          .addClass('sfc_event sfc_goal ' + goalTypeClass + ' tipso top')
          .html('&nbsp;')
          .css('left', 'calc(' + position + '% - 8px)')
          .attr('data-tipso', '<strong>' + goal.minute + '</strong><br>' + goal.player + ' (' + goal.score[0] + '-' + goal.score[1] + ')')
          .tipso(tooltipSettings),
      );
    }

    for (index in events.cards) {
      card = events.cards[index];

      if (card.team_id !== team_id) {
        continue;
      }

      eventTime = parseInt(card.minute.replace(/[^\d]*$/, ''));
      position = (100 / minutes * eventTime);

      $html.append(
        $j('<i>')
          .addClass('sfc_event sfc_card sfc_' + card.type)
          .html('&nbsp;')
          .css('left', 'calc(' + position + '% - 8px)')
          .attr('data-tipso', '<strong>' + card.minute + '</strong><br>' + card.player)
          .tipso(tooltipSettings),
      );
    }

    for (index in events.subs) {
      sub = events.subs[index];

      if (sub.team_id !== team_id) {
        continue;
      }

      eventTime = parseInt(sub.minute.replace(/[^\d]*$/, ''));
      position = (100 / minutes * eventTime);

      $html.append(
        $j('<i>')
          .addClass('sfc_event sfc_sub')
          .html('&nbsp;')
          .css('left', 'calc(' + position + '% - 8px)')
          .attr('data-tipso', '<strong>' + sub.minute + '</strong><br>' + parent.translate('Off') + ': ' + sub.off + '<br>' + parent.translate('On') + ': ' + sub.on)
          .tipso(tooltipSettings),
      );
    }

    return $html;
  };

  this.getTimelineAnnotationsHtml = function (minutes) {
    var position;

    var $html = $j('<div>').addClass('sfc_annotations');

    for (var i = 0; i <= minutes; i += 10) {
      position = (100 / minutes * i);

      $html.append(
        $j('<span>').addClass('sfc_annotation').text(i + '\'').css('left', 'calc(' + position + '% - 10px)'),
      );
    }

    return $html;
  };

  this.getPlayersHtml = function (heading, homePlayers, awayPlayers, events, parent) {
    var index, home, away, homeName, awayName, goalType, goalTypeClass, goal, card, sub;

    var $html = $j('<table>').addClass('sfc_players').append(
      $j('<thead>').append(
        $j('<tr>').append(
          $j('<th>').attr('colspan', 4).text(heading),
        ),
      ),
      $j('<tbody>'),
    );

    var maxKey = Math.max(homePlayers.length, awayPlayers.length);

    if (maxKey === 0) {
      $html.find('tbody').append(
        $j('<tr>').append(
          $j('<td>').attr('colspan', 4).css('text-align', 'center').text(parent.translate('Awaiting squad lists…')),
        ),
      );

      return $html;
    }

    for (var key = 0; key < maxKey; key++) {
      home = homePlayers[key] || {};
      away = awayPlayers[key] || {};

      homeName = home.name;
      awayName = away.name;

      for (index in events.cards) {
        card = events.cards[index];

        if (card.player_id === home.id) {
          homeName += ' <i class="sfc_event sfc_card sfc_' + card.type + '">&nbsp;</i>';
        } else if (card.player_id === away.id) {
          awayName = '<i class="sfc_event sfc_card sfc_' + card.type + '">&nbsp;</i> ' + awayName;
        }
      }

      for (index in events.goals) {
        goal = events.goals[index];

        goalType = goal.type;
        goalTypeClass = '';

        if (goalType !== null && goalType.length > 0) {
          goalTypeClass = 'sfc_' + goalType;
        }

        if (goal.player_id === home.id) {
          homeName += ' <i class="sfc_event sfc_goal ' + goalTypeClass + '">&nbsp;</i>';
        } else if (goal.player_id === away.id) {
          awayName = '<i class="sfc_event sfc_goal ' + goalTypeClass + '">&nbsp;</i> ' + awayName;
        }
      }

      for (index in events.subs) {
        sub = events.subs[index];

        if (sub.off_id === home.id) {
          homeName += ' <i class="sfc_event sfc_suboff">&nbsp;</i>';
        } else if (sub.on_id === home.id) {
          homeName += ' <i class="sfc_event sfc_subon">&nbsp;</i>';
        } else if (sub.off_id === away.id) {
          awayName = '<i class="sfc_event sfc_suboff">&nbsp;</i> ' + awayName;
        } else if (sub.on_id === away.id) {
          awayName = '<i class="sfc_event sfc_subon">&nbsp;</i> ' + awayName;
        }
      }

      $html.find('tbody').append(
        $j('<tr>').append(
          $j('<td>').addClass('sfc_home sfc_number').text(home.number),
          $j('<td>').addClass('sfc_home sfc_name').html(homeName),
          $j('<td>').addClass('sfc_away sfc_name').html(awayName),
          $j('<td>').addClass('sfc_away sfc_number').text(away.number),
        ),
      );
    }

    return $html;
  };

  this.loadLang = function (id, l) {
    if (document.getElementById(id)) {
      return;
    }

    var lang, flang = document.getElementsByTagName('script')[0];

    lang = document.createElement('script');
    lang.id = id;
    lang.src = 'https://cdn.statsfc.com/js/lang/' + l + '.js';

    flang.parentNode.insertBefore(lang, flang);
  };

  this.loadCss = function (id) {
    if (document.getElementById(id)) {
      return;
    }

    var css, fcss = (document.getElementsByTagName('link')[0] || document.getElementsByTagName('script')[0]);

    css = document.createElement('link');
    css.id = id;
    css.rel = 'stylesheet';
    css.href = 'https://cdn.statsfc.com/css/match-centre.css';

    fcss.parentNode.insertBefore(css, fcss);
  };
}

/**
 * Load widgets dynamically using data-* attributes
 */
$j('div.statsfc-match-centre').each(function () {
  var key = $j(this).data('key'),
    match_centre = new StatsFC_MatchCentre(key),
    data = $j(this).data();

  for (var i in data) {
    match_centre[i] = data[i];
  }

  match_centre.display($j(this));
});
