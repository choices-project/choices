import { fireEvent, render, screen } from '@testing-library/react';

import CivicsNavigation from '../CivicsNavigation';

const mockSetShowAddressForm = jest.fn();
const mockSetNewAddress = jest.fn();
const mockHandleAddressUpdate = jest.fn(() => Promise.resolve());
const mockFindByLocation = jest.fn(() => Promise.resolve({ success: true }));

const mockUseUserActions = jest.fn();
const mockUseUserCurrentAddress = jest.fn();
const mockUseUserShowAddressForm = jest.fn();
const mockUseUserNewAddress = jest.fn();
const mockUseUserAddressLoading = jest.fn();
const mockUseRepresentativeGlobalLoading = jest.fn();

jest.mock('@/hooks/useI18n', () => ({
  useI18n: () => ({
    t: (key: string) => key,
  }),
}));

jest.mock('@/lib/stores', () => ({
  useUserActions: () => mockUseUserActions(),
  useUserCurrentAddress: () => mockUseUserCurrentAddress(),
  useUserShowAddressForm: () => mockUseUserShowAddressForm(),
  useUserNewAddress: () => mockUseUserNewAddress(),
  useUserAddressLoading: () => mockUseUserAddressLoading(),
}));

jest.mock('@/lib/stores/representativeStore', () => ({
  useFindByLocation: () => mockFindByLocation,
  useRepresentativeGlobalLoading: () => mockUseRepresentativeGlobalLoading(),
}));

describe('CivicsNavigation accessibility', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseUserActions.mockReturnValue({
      setShowAddressForm: mockSetShowAddressForm,
      setNewAddress: mockSetNewAddress,
      handleAddressUpdate: mockHandleAddressUpdate,
    });
    mockUseUserCurrentAddress.mockReturnValue('123 Main St');
    mockUseUserShowAddressForm.mockReturnValue(true);
    mockUseUserNewAddress.mockReturnValue('456 Elm St');
    mockUseUserAddressLoading.mockReturnValue(false);
    mockUseRepresentativeGlobalLoading.mockReturnValue(false);
  });

  const renderComponent = () =>
    render(<CivicsNavigation onRepresentativesClick={jest.fn()} />);

  it('renders address modal with proper dialog semantics and focuses input', () => {
    renderComponent();

    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');

    const heading = screen.getByText('civics.navigation.modal.title');
    expect(dialog).toHaveAttribute('aria-labelledby', heading.getAttribute('id'));

    const description = screen.getByText('civics.navigation.modal.description');
    expect(dialog).toHaveAttribute('aria-describedby', description.getAttribute('id'));

    const input = screen.getByPlaceholderText('civics.navigation.modal.addressPlaceholder');
    expect(input).toHaveFocus();
  });

  it('closes the modal when pressing Escape', () => {
    renderComponent();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(mockSetShowAddressForm).toHaveBeenCalledWith(false);
  });

  it('close button announces label and closes modal', () => {
    renderComponent();
    const closeButton = screen.getByRole('button', { name: 'civics.navigation.modal.close' });
    fireEvent.click(closeButton);
    expect(mockSetShowAddressForm).toHaveBeenCalledWith(false);
  });
});

