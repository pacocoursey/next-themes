import {render, screen} from "@testing-library/react";
import {ThemeContext, ThemeProvider, UseThemeProps} from "../index";
import React from "react";

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
})

describe("defaultTheme test-suite", () => {

    test('should return system when using default settings', () => {
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

        expect(screen.getByTestId("theme").textContent).toBe("system")
    })

    test('should return light when set it as default-theme', () => {
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

        expect(screen.getByTestId("theme").textContent).toBe("light")
    })

    test('should return dark when set as default-theme', () => {
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

        expect(screen.getByTestId("theme").textContent).toBe("dark")
    })
});
