interface ResumeConfig {
  json?: string;
}

declare const resume: ResumeConfig | undefined;

interface JSON {
  minify?(input: string): string;
}
