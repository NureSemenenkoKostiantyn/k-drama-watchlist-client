import { nextWheelRotation, shouldDisableWheelItemDrag } from './wheel-page';

describe('nextWheelRotation', () => {
  it('lands the server-selected segment beneath the top pointer', () => {
    const rotation = nextWheelRotation(0, 1, 4);
    const selectedSegmentCenter = 135;

    expect(positiveModulo(rotation + selectedSegmentCenter, 360)).toBeCloseTo(0, 8);
    expect(rotation).toBeGreaterThanOrEqual(6 * 360);
  });

  it('continues forward from the current rotation', () => {
    const current = 2_385;
    const rotation = nextWheelRotation(current, 2, 5);
    const selectedSegmentCenter = 180;

    expect(rotation).toBeGreaterThan(current);
    expect(positiveModulo(rotation + selectedSegmentCenter, 360)).toBeCloseTo(0, 8);
  });

  it('does not change rotation for an invalid result', () => {
    expect(nextWheelRotation(720, -1, 3)).toBe(720);
    expect(nextWheelRotation(720, 3, 3)).toBe(720);
    expect(nextWheelRotation(720, 0, 0)).toBe(720);
  });
});

describe('shouldDisableWheelItemDrag', () => {
  it('uses button-only reordering on mobile', () => {
    expect(shouldDisableWheelItemDrag(true, true, false, false)).toBe(true);
    expect(shouldDisableWheelItemDrag(false, true, false, false)).toBe(false);
  });

  it('also disables dragging for read-only and busy wheels', () => {
    expect(shouldDisableWheelItemDrag(false, false, false, false)).toBe(true);
    expect(shouldDisableWheelItemDrag(false, true, true, false)).toBe(true);
    expect(shouldDisableWheelItemDrag(false, true, false, true)).toBe(true);
  });
});

function positiveModulo(value: number, divisor: number): number {
  return ((value % divisor) + divisor) % divisor;
}
