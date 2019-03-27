import { FunctionComponent, ReactElement } from 'react';
import { useSingleDOMRef } from './useSingleDOMRef';
import { mount, ReactWrapper } from 'enzyme';
import { HTMLTargetDelegate } from './models';

interface IProps {
  something?: string;
  children(testTarget: HTMLTargetDelegate): ReactElement;
}

function createTest(renderedChildren: (setTarget: HTMLTargetDelegate) => ReactElement) {
  const state = {
    element: undefined as HTMLElement,
    connectedCallCount: 0,
    disconnectedCallCount: 0,
    component: undefined as ReactWrapper<any, Readonly<{}>, React.Component<{}, {}, any>>,
    dispose: () => void 0,
  };

  const Component: FunctionComponent<IProps> = ({ children }) => {
    const testTarget = useSingleDOMRef({
      connected: element => { state.element = element; state.connectedCallCount++; },
      disconnected: () => { state.element = undefined; state.disconnectedCallCount++; },
    });
    return children(testTarget);
  };

  const component = mount((
    <Component>
      {renderedChildren}
    </Component>
  ));
  state.component = component;
  state.dispose = () => { component.unmount(); };

  return state;
}

describe('useSingleDOMRef', () => {

  it('can get a reference from an element', () => {
    const state = createTest(setTarget => (<div ref={setTarget}></div>));
    expect(state).to.eql({
      ...state,
      connectedCallCount: 1,
      disconnectedCallCount: 0,
    });
    expect(state).to.have.property('element').and.not.to.be.undefined;
    state.dispose();
  });

  it('doesn\'t disconnect and reconnect when a force update is used and always returns the same setElement function', () => {
    let setElementFunc: HTMLTargetDelegate;
    const state = createTest(setTarget => {
      setElementFunc = setTarget;
      return (
        <div ref={setTarget}></div>
      );
    });
    expect(setElementFunc).to.be.a('function');
    const prevSetElementFunc = setElementFunc;
    state.component.setProps({ something: 'else' });
    expect(prevSetElementFunc).to.eq(setElementFunc);
    expect(state).to.eql({
      ...state,
      connectedCallCount: 1, // should still be 1
      disconnectedCallCount: 0,
    });
    expect(state).to.have.property('element').and.not.to.be.undefined;
    state.dispose();
  });

  it('calls disconnect when the child is removed', () => {
    const state = createTest(setTarget => (<div ref={setTarget}></div>));
    state.component.setProps({ children: (() => null) });
    expect(state).to.eql({
      ...state,
      connectedCallCount: 1,
      disconnectedCallCount: 1,
    });
    state.dispose();
  });

  it('calls disconnect and re-connect when the child is changed', () => {
    const state = createTest(setTarget => (<div ref={setTarget}></div>));
    state.component.setProps({ children: (setTarget: HTMLTargetDelegate) => (<span ref={setTarget}></span>) });
    expect(state).to.eql({
      ...state,
      connectedCallCount: 2,
      disconnectedCallCount: 1,
    });
    state.dispose();
  });

  it('calls through, but gets immediately returned because the elements are the same', () => {
    const state = createTest(setTarget => (<div ref={setTarget} style={{ backgroundColor: 'blue' }}></div>));
    state.component.setProps({
      children: (setTarget: HTMLTargetDelegate) => (
        <div ref={setTarget} style={{ backgroundColor: 'red' }}></div>
      ),
    });
    expect(state).to.eql({
      ...state,
      connectedCallCount: 1,
      disconnectedCallCount: 0,
    });
    state.dispose();
  });

});