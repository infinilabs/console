/*
 *   Copyright 2019 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 *
 *   Licensed under the Apache License, Version 2.0 (the "License").
 *   You may not use this file except in compliance with the License.
 *   A copy of the License is located at
 *
 *       http://www.apache.org/licenses/LICENSE-2.0
 *
 *   or in the "license" file accompanying this file. This file is distributed
 *   on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either
 *   express or implied. See the License for the specific language governing
 *   permissions and limitations under the License.
 */

import React, { Component } from 'react';
import PropTypes from 'prop-types';
import _ from 'lodash';
import queryString from 'query-string';
import { EuiBreadcrumbs } from '@elastic/eui';
import {
  APP_PATH,
  DESTINATION_ACTIONS,
  MONITOR_ACTIONS,
  TRIGGER_ACTIONS,
} from '../../utils/constants';
import { formatMessage } from 'umi/locale';

const propTypes = {
  history: PropTypes.object.isRequired,
  httpClient: PropTypes.object.isRequired,
  location: PropTypes.object.isRequired,
  title: PropTypes.string.isRequired,
};

export default class Breadcrumbs extends Component {
  constructor(props) {
    super(props);

    this.state = { breadcrumbs: [] };

    this.getBreadcrumbs = this.getBreadcrumbs.bind(this);
  }

  componentDidMount() {
    this.getBreadcrumbs();
  }

  componentDidUpdate(prevProps) {
    const {
      location: { pathname: prevPathname, search: prevSearch },
    } = prevProps;
    const {
      location: { pathname, search },
    } = this.props;
    if (prevPathname + prevSearch !== pathname + search) {
      this.getBreadcrumbs();
    }
  }

  async getBreadcrumbs() {
    const {
      httpClient,
      history,
      location: { state: routeState },
    } = this.props;
    const rawBreadcrumbs = await getBreadcrumbs(window.location.hash, routeState, httpClient);
    const breadcrumbs = rawBreadcrumbs.map((breadcrumb) =>
      createEuiBreadcrumb(breadcrumb, history)
    );
    this.setState({ breadcrumbs });
  }

  render() {
    const { breadcrumbs } = this.state;
    return (
      <EuiBreadcrumbs
        breadcrumbs={breadcrumbs}
        responsive={false}
        truncate={true}
        style={{ padding: '0px 15px' }}
      />
    );
  }
}

Breadcrumbs.propTypes = propTypes;

export function createEuiBreadcrumb(breadcrumb, history) {
  const { text, href } = breadcrumb;
  return {
    text,
    href: `#${href}`,
    onClick: (e) => {
      e.preventDefault();
      history.push(href);
    },
  };
}

export async function getBreadcrumbs(hash, routeState, httpClient) {
  const routes = parseLocationHash(hash);
  const asyncBreadcrumbs = await Promise.all(
    routes.map((route) => getBreadcrumb(route, routeState, httpClient))
  );
  const breadcrumbs = _.flatten(asyncBreadcrumbs).filter((breadcrumb) => !!breadcrumb);
  return breadcrumbs;
}

export function parseLocationHash(hash) {
  return hash.split('/').filter((route) => !!route);
}

export async function getBreadcrumb(route, routeState, httpClient) {
  const [base, queryParams] = route.split('?');
  if (!base) return null;
  // This condition is true for any auto generated 20 character long,
  // URL-safe, base64-encoded document ID by elasticsearch
  if (RegExp(/^[0-9a-z_-]{20}$/i).test(base)) {
    const { action } = queryString.parse(`?${queryParams}`);
    switch (action) {
      case DESTINATION_ACTIONS.UPDATE_DESTINATION:
        const destinationName = _.get(routeState, 'destinationToEdit.name', base);
        const destinationBreadcrumbs = [{ text: destinationName, href: `/destinations/${base}` }];
        if (action === DESTINATION_ACTIONS.UPDATE_DESTINATION) {
          destinationBreadcrumbs.push({ text: formatMessage({ id: 'alert.button.update-destination' }), href: '/' });
        }
        return destinationBreadcrumbs;
      default:
        // TODO::Everything else is considered as monitor, we should break this.
        let monitorName = base;
        try {
          const response = await httpClient.get(`/alerting/monitors/${base}`);
          if (response.ok) {
            monitorName = response.resp.name;
          }
        } catch (err) {
          console.error(err);
        }
        const breadcrumbs = [{ text: monitorName, href: `/monitors/${base}` }];
        if (action === MONITOR_ACTIONS.UPDATE_MONITOR)
          breadcrumbs.push({ text: formatMessage({ id: 'alert.button.update-monitor' }), href: '/' });
        if (action === TRIGGER_ACTIONS.CREATE_TRIGGER)
          breadcrumbs.push({ text: formatMessage({ id: 'alert.button.create-trigger' }), href: '/' });
        if (action === TRIGGER_ACTIONS.UPDATE_TRIGGER)
          breadcrumbs.push({ text: formatMessage({ id: 'alert.button.update-trigger' }), href: '/' });
        return breadcrumbs;
    }
  }

  return {
    '#': { text: formatMessage({ id: 'alert.alerting' }), href: '/' },
    monitors: { text: formatMessage({ id: 'alert.monitor' }), href: '/monitors' },
    dashboard: { text: formatMessage({ id: 'alert.dashboard' }), href: '/dashboard' },
    destinations: { text: formatMessage({ id: 'alert.destination' }), href: '/destinations' },
    'create-monitor': [
      { text: formatMessage({ id: 'alert.monitor' }), href: '/monitors' },
      { text: formatMessage({ id: 'alert.button.create-monitor' }), href: APP_PATH.CREATE_MONITOR },
    ],
    'create-destination': [
      { text: formatMessage({ id: 'alert.destination' }), href: '/destinations' },
      { text: formatMessage({ id: 'alert.button.create-destination' }), href: APP_PATH.CREATE_DESTINATION },
    ],
  }[base];
}
