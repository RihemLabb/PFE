import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import AgentQrScanner from './AgentQrScanner';

vi.mock('@zxing/browser', () => ({
  BrowserQRCodeReader: class {
    decodeFromConstraints() {
      return new Promise(() => undefined);
    }
  },
}));

afterEach(() => cleanup());

describe('AgentQrScanner', () => {
  it('explains that the agent scans the visitor ticket', () => {
    render(
      <AgentQrScanner open onClose={vi.fn()} onScan={vi.fn()} />,
    );

    expect(screen.getByText('Scan appointment QR')).toBeInTheDocument();
    expect(
      screen.getByText(/Ask the visitor to present the QR ticket/i),
    ).toBeInTheDocument();
  });

  it('allows the agent to close the camera', () => {
    const onClose = vi.fn();
    render(<AgentQrScanner open onClose={onClose} onScan={vi.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: 'Close scanner' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
