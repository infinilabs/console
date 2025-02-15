import dateMath from '@elastic/datemath';
import moment from 'moment';
import { timeUnits, timeUnitsPlural } from './time_units';
import { getDateMode, DATE_MODES } from './date_modes';
import { parseRelativeParts } from './relative_utils';

const ISO_FORMAT = 'YYYY-MM-DDTHH:mm:ss.SSSZ';

export const commonDurationRanges = [
  { start: 'now/d', end: 'now/d', label: 'Today' },
  { start: 'now/w', end: 'now/w', label: 'This week' },
  { start: 'now/M', end: 'now/M', label: 'This month' },
  { start: 'now/y', end: 'now/y', label: 'This year' },
  { start: 'now-1d/d', end: 'now-1d/d', label: 'Yesterday' },
  { start: 'now/w', end: 'now', label: 'Week to date' },
  { start: 'now/M', end: 'now', label: 'Month to date' },
  { start: 'now/y', end: 'now', label: 'Year to date' },
];

function cantLookup(timeFrom, timeTo, dateFormat) {
  const displayFrom = formatTimeString(timeFrom, dateFormat);
  const displayTo = formatTimeString(timeTo, dateFormat, true);
  return `${displayFrom} ~ ${displayTo}`;
}

export default function isRelativeToNow(timeFrom, timeTo) {
  const fromDateMode = getDateMode(timeFrom);
  const toDateMode = getDateMode(timeTo);
  const isLast = fromDateMode === DATE_MODES.RELATIVE && toDateMode === DATE_MODES.NOW;
  const isNext = fromDateMode === DATE_MODES.NOW && toDateMode === DATE_MODES.RELATIVE;
  const isRelative = fromDateMode === DATE_MODES.RELATIVE && toDateMode === DATE_MODES.RELATIVE;
  return isLast || isNext || isRelative;
}

export function formatTimeString(timeString, dateFormat, roundUp = false, locale = 'en') {
  const timeAsMoment = moment(timeString, ISO_FORMAT, true);
  if (timeAsMoment.isValid()) {
    return timeAsMoment.locale(locale).format(dateFormat);
  }

  if (timeString === 'now') {
    return 'now';
  }

  const tryParse = dateMath.parse(timeString, { roundUp: roundUp });
  if (moment.isMoment(tryParse)) {
    return `~ ${tryParse.locale(locale).fromNow()}`;
  }

  return timeString;
}

export function prettyDuration(timeFrom, timeTo, quickRanges = [], dateFormat, locales) {
  const matchingQuickRange = quickRanges.find(({ start: quickFrom, end: quickTo }) => {
    return timeFrom === quickFrom && timeTo === quickTo;
  });
  if (matchingQuickRange && matchingQuickRange.key) {
    return locales[`datepicker.quick_select.${matchingQuickRange.key}`];
  }

  if (isRelativeToNow(timeFrom, timeTo)) {
    let timeTense;
    let relativeParts;
    if (getDateMode(timeTo) === DATE_MODES.NOW) {
      timeTense = locales[`datepicker.quick_select.last`];
      relativeParts = parseRelativeParts(timeFrom);
    } else {
      timeTense = locales[`datepicker.quick_select.next`];
      relativeParts = parseRelativeParts(timeTo);
    }
    const countTimeUnit = relativeParts.unit.substring(0, 1);
    let countTimeUnitFullName = locales[`datepicker.time.units.${countTimeUnit}`]
    if (relativeParts.count === 1 && countTimeUnitFullName.substring(countTimeUnitFullName.length - 1) === 's') {
      countTimeUnitFullName = countTimeUnitFullName.substring(0, countTimeUnitFullName.length - 1)
    }
    let text = `${timeTense} ${relativeParts.count} ${countTimeUnitFullName}`;
    if (relativeParts.round && relativeParts.roundUnit) {
      text += ` rounded to the ${timeUnits[relativeParts.roundUnit]}`;
    }
    return text;
  }

  return cantLookup(timeFrom, timeTo, dateFormat);
}

export function showPrettyDuration(timeFrom, timeTo, quickRanges = []) {
  const matchingQuickRange = quickRanges.find(({ start: quickFrom, end: quickTo }) => {
    return timeFrom === quickFrom && timeTo === quickTo;
  });
  if (matchingQuickRange) {
    return true;
  }

  return isRelativeToNow(timeFrom, timeTo);
}
