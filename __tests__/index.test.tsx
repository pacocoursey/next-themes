import {act, render, screen} from "@testing-library/react";
import {ThemeProvider, useTheme} from "../index";
import React, {useEffect} from "react";

let localStorageMock: { [key: string]: string } = {}

// HelperComponent to set a theme using the useTheme-hook
const HelperComponent = ({forceSetTheme}: { forceSetTheme?: string }) => {
    const {setTheme, theme} = useTheme()

    useEffect(() => {
        if (forceSetTheme) {
            setTheme(forceSetTheme)
        }
    }, [forceSetTheme])

    return <p data-testid="theme">{theme}</p>;
}

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

    test('should return system when no default-theme is set', () => {
        render(
            <ThemeProvider>
                <HelperComponent />
            </ThemeProvider>
        )

        expect(screen.getByTestId('theme').textContent).toBe('system')
    })

    test('should return light when no default-theme is set and enableSystem=false', () => {
        render(
            <ThemeProvider enableSystem={false}>
                <HelperComponent />
            </ThemeProvider>
        )

        expect(screen.getByTestId('theme').textContent).toBe('light')
    })

    test('should return light when light is set as default-theme', () => {
        render(
            <ThemeProvider defaultTheme="light">
                <HelperComponent />
            </ThemeProvider>
        )

        expect(screen.getByTestId('theme').textContent).toBe('light')
    })

    test('should return dark when dark is set as default-theme', () => {
        render(
            <ThemeProvider defaultTheme="dark">
                <HelperComponent />
            </ThemeProvider>
        )

        expect(screen.getByTestId('theme').textContent).toBe('dark')
    })
});

describe('custom storageKey test-suite', () => {

    test('should save to localStorage with \'theme\' key when using default settings', () => {
        act(() => {
            render(<ThemeProvider>
                <HelperComponent forceSetTheme="light"/>
            </ThemeProvider>)
        })

        expect(global.Storage.prototype.getItem).toHaveBeenCalledWith('theme')
        expect(global.Storage.prototype.setItem).toHaveBeenCalledWith('theme', 'light')
    })

    test('should save to localStorage with \'custom\' when setting prop \'storageKey\' to \'customKey\'', () => {
        act(() => {
            render(<ThemeProvider storageKey="customKey">
                <HelperComponent forceSetTheme="light"/>
            </ThemeProvider>)
        })

        expect(global.Storage.prototype.getItem).toHaveBeenCalledWith('customKey')
        expect(global.Storage.prototype.setItem).toHaveBeenCalledWith('customKey', 'light')
    })

})

describe('custom attribute test-suite', () => {

    test('should use data-theme attribute when using default', () => {
        act(() => {
            render(<ThemeProvider>
                <HelperComponent forceSetTheme="light"/>
            </ThemeProvider>)
        })

        expect(document.documentElement.getAttribute("data-theme")).toBe("light")
    })

    test('should use class attribute (CSS-class) when attribute="class"', () => {
        act(() => {
            render(<ThemeProvider attribute="class">
                <HelperComponent forceSetTheme="light"/>
            </ThemeProvider>)
        })

        expect(document.documentElement.classList.contains("light")).toBeTruthy()
    });

    test('should use "data-example"-attribute when attribute="data-example"', () => {
        act(() => {
            render(<ThemeProvider attribute="data-example">
                <HelperComponent forceSetTheme="light"/>
            </ThemeProvider>)
        })

        expect(document.documentElement.getAttribute('data-example')).toBe('light')
    })

})

describe('custom value-mapping test-suite', () => {

    test('should use custom value mapping when using value={{pink:"my-pink-theme"}}', () => {
        localStorageMock["theme"] = "pink"

        act(() => {
            render(<ThemeProvider themes={['pink', 'light', 'dark', 'system']} value={{pink: "my-pink-theme"}}>
                <HelperComponent forceSetTheme="pink"/>
            </ThemeProvider>)
        })

        expect(document.documentElement.getAttribute('data-theme')).toBe('my-pink-theme')
        expect(global.Storage.prototype.setItem).toHaveBeenCalledWith('theme', 'pink')
    })

})
