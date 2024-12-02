import React, { ErrorInfo, ReactElement } from "react";
import {router} from 'umi';

interface ErrorBoundaryState {
  hasError: boolean;
  errorMessage: string;
}
interface ErrorboundaryProps {
  children: ReactElement;
}
export class ErrorBoundary extends React.Component<
  ErrorboundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorboundaryProps) {
    super(props);
  }
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // this.setState({ hasError: true });
    this.setState({ errorMessage: error.message });
    router.push({
      pathname: '/exception/application',
      state: {
        error: error.message,
        stack: errorInfo.componentStack,
      }
    })
    //Do something with err and errorInfo
  }
  render(): React.ReactNode {
    return this.props.children;
  }
}
