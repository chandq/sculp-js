import { tooltipEvent } from '../src/tooltip';

test('tooltip', () => {
  const div = document.createElement('div');
  const event = new MouseEvent('mouseenter', {
    bubbles: true,
    cancelable: true
  });
  div.setAttribute('id', 'root2');
  document.body.appendChild(div);
  tooltipEvent.handleMouseEnter({ rootContainer: div, title: 'hello js', event });
  tooltipEvent.handleMouseLeave(div);

  tooltipEvent.handleMouseEnter({ rootContainer: '#root2', title: 'hello js', event });
  tooltipEvent.handleMouseLeave('#root2');
  document.body.removeChild(div);

  // element.dispatchEvent(event);
});
