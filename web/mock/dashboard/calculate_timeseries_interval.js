// Copyright (C) INFINI Labs & INFINI LIMITED.
//
// The INFINI Console is offered under the GNU Affero General Public License v3.0
// and as commercial software.
//
// For commercial licensing, contact us at:
//   - Website: infinilabs.com
//   - Email: hello@infini.ltd
//
// Open Source licensed under AGPL V3:
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU Affero General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
// GNU Affero General Public License for more details.
//
// You should have received a copy of the GNU Affero General Public License
// along with this program. If not, see <http://www.gnu.org/licenses/>.

import moment from 'moment';

const d = moment.duration;
const roundingRules = [
  [d(500, 'ms'), d(100, 'ms')],
  [d(5, 'second'), d(1, 'second')],
  [d(7.5, 'second'), d(5, 'second')],
  [d(15, 'second'), d(10, 'second')],
  [d(45, 'second'), d(30, 'second')],
  [d(3, 'minute'), d(1, 'minute')],
  [d(9, 'minute'), d(5, 'minute')],
  [d(20, 'minute'), d(10, 'minute')],
  [d(45, 'minute'), d(30, 'minute')],
  [d(2, 'hour'), d(1, 'hour')],
  [d(6, 'hour'), d(3, 'hour')],
  [d(24, 'hour'), d(12, 'hour')],
  [d(1, 'week'), d(1, 'd')],
  [d(3, 'week'), d(1, 'week')],
  [d(1, 'year'), d(1, 'month')],
  [Infinity, d(1, 'year')],
];

function find(rules, check) {
  function pick(buckets, duration) {
    const target = duration / buckets;
    let lastResp;

    for (let i = 0; i < rules.length; i++) {
      const rule = rules[i];
      const resp = check(rule[0], rule[1], target);

      if (resp == null) {
        if (lastResp) {
          return lastResp;
        }
        break;
      }

      lastResp = resp;
    }

    // fallback to just a number of milliseconds, ensure ms is >= 1
    const ms = Math.max(Math.floor(target), 1);
    return moment.duration(ms, 'ms');
  }

  return function (buckets, duration) {
    const interval = pick(buckets, duration);
    if (interval) {
      return moment.duration(interval._data);
    }
  };
}

const revRoundingRules = roundingRules.slice(0).reverse();

/*
 * 24 hours: 600 seconds
 * 12 hours: 300 seconds
 * 4 hours: 60 seconds
 * 1 hour: 30 seconds
 * 15 minutes: 10 seconds
 */
export const calculateAuto = find(revRoundingRules, (bound, interval, target) => {
  if (bound > target) {
    return interval;
  }
});


export function calculateTimeseriesInterval(
  lowerBoundInMsSinceEpoch,
  upperBoundInMsSinceEpoch,
  minIntervalSeconds
) {
  const duration = moment.duration(upperBoundInMsSinceEpoch - lowerBoundInMsSinceEpoch, 'ms');

  return Math.max(minIntervalSeconds, calculateAuto(100, duration).asSeconds());
}