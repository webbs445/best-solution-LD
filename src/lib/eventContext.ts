/** Fields a page adds to every dataLayer event it sends (e.g. /services: page_path and page_type). Empty on other pages. */
let context: Record<string, string> = {};
export const setEventContext = (c: Record<string, string>): void => void (context = c);
export const eventContext = (): Record<string, string> => context;
