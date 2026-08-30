import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Button } from '../ui/Button';

interface Props { children: ReactNode; resetKey: string; onReset: () => void }
interface State { failed: boolean }

export class ModuleErrorBoundary extends Component<Props, State> {
  state: State = { failed: false };
  static getDerivedStateFromError(): State { return { failed: true }; }
  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[Escalita] Module render failed', error, info);
  }
  componentDidUpdate(previous: Props) {
    if (this.state.failed && previous.resetKey !== this.props.resetKey) this.setState({ failed: false });
  }
  render() {
    if (!this.state.failed) return this.props.children;
    return <div className="module-error"><strong>Модуль не удалось отобразить</strong><Button variant="secondary" onClick={this.props.onReset}>Сбросить настройки</Button></div>;
  }
}
