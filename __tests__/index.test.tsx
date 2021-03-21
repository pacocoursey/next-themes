import {act, render, screen} from "@testing-library/react";
import {ThemeContext, ThemeProvider, useTheme, UseThemeProps} from "../index";
import React, {useEffect} from "react";

let localStorageMock: { [key: string]: string } = {}

beforeAll(() => {
    // Create a mock of the window.matchMedia function
    // Based on: https://stackoverflow.com/questions/39830580/jest-test-fails-typeerror-window-matchmedia-is-not-a-function
    Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: jest.fn().mockImplementation(query => ({
            matches: false,
            media: query,
            onchange: null,
            addListener: jest.fn(), // Deprecated
            removeListener: jest.fn(), // Deprecated
            addEventListener: jest.fn(),
            removeEventListener: jest.fn(),
            dispatchEvent: jest.fn(),
        })),
    })

    // Create mocks of localStorage getItem and setItem functions
    global.Storage.prototype.getItem = jest.fn((key: string) => localStorageMock[key])
    global.Storage.prototype.setItem = jest.fn((key: string, value: string) => {
        localStorageMock[key] = value;
    })
})

beforeEach(() => {
    // Clear the localStorage-mock
    localStorageMock = {}
})

describe('defaultTheme test-suite', () => {

    test('should return system when no default theme is set', () => {
        render(
            <ThemeProvider>
                <ThemeContext.Consumer>
                    {
                        ({theme}: UseThemeProps) => (
                            <p data-testid="theme">{theme}</p>
                        )
                    }
                </ThemeContext.Consumer>
            </ThemeProvider>
        )

        expect(screen.getByTestId('theme').textContent).toBe('system')
    })

    test('should return light when no default theme is set and enableSystem=false', () => {
        render(
            <ThemeProvider enableSystem={false}>
                <ThemeContext.Consumer>
                    {
                        ({theme}: UseThemeProps) => (
                            <p data-testid="theme">{theme}</p>
                        )
                    }
                </ThemeContext.Consumer>
            </ThemeProvider>
        )

        expect(screen.getByTestId('theme').textContent).toBe('light')
    })

    test('should return light when light is set as default-theme', () => {
        render(
            <ThemeProvider defaultTheme="light">
                <ThemeContext.Consumer>
                    {
                        ({theme}: UseThemeProps) => (
                            <p data-testid="theme">{theme}</p>
                        )
                    }
                </ThemeContext.Consumer>
            </ThemeProvider>
        )

        expect(screen.getByTestId('theme').textContent).toBe('light')
    })

    test('should return dark when dark is set as default-theme', () => {
        render(
            <ThemeProvider defaultTheme="dark">
                <ThemeContext.Consumer>
                    {
                        ({theme}: UseThemeProps) => (
                            <p data-testid="theme">{theme}</p>
                        )
                    }
                </ThemeContext.Consumer>
            </ThemeProvider>
        )

        expect(screen.getByTestId('theme').textContent).toBe('dark')
    })
});

describe('custom storageKey test-suite', () => {

    const HelperComponent = ({theme}: { theme: string }) => {
        const {setTheme} = useTheme()

        useEffect(() => {
            setTheme(theme)
        }, [])

        return null;
    }

    test('should save to localStorage with \'theme\' key when using default settings', () => {
        act(() => {
            render(<ThemeProvider>
                <HelperComponent theme="light"/>
            </ThemeProvider>)
        })

        expect(global.Storage.prototype.getItem).toHaveBeenCalledWith('theme')
        expect(global.Storage.prototype.setItem).toHaveBeenCalledWith('theme', 'light')
    })

    test('should save to localStorage with \'custom\' when setting prop \'storageKey\' to \'customKey\'', () => {
        act(() => {
            render(<ThemeProvider storageKey="customKey">
                <HelperComponent theme="light"/>
            </ThemeProvider>)
        })

        expect(global.Storage.prototype.getItem).toHaveBeenCalledWith('customKey')
        expect(global.Storage.prototype.setItem).toHaveBeenCalledWith('customKey', 'light')
    })

})
