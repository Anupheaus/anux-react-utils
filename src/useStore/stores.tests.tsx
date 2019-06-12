import { mount } from 'enzyme';
import { Stores } from './stores';
import { defineStore } from './defineStore';
import { FunctionComponent } from 'react';
import { useStore } from './useStore';

describe('useStore - stores', () => {

  const TestStore1 = defineStore()
    .data({})
    .create();

  const TestStore2 = defineStore()
    .data({ something: 'more' })
    .create();

  const Component: FunctionComponent = () => {
    const [{ something }] = useStore(TestStore2);
    return <div>{something}</div>;
  };

  it('can be instantiated', () => {
    const component = mount((
      <Stores stores={[<TestStore1 />, <TestStore2 initialData={{ something: 'blah' }} />]}>
        <Component />
      </Stores>
    ));
    expect(component.html()).to.eq('<div>blah</div>');
  });

});