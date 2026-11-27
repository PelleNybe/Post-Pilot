# Contributing to PostPilot ✨

Contributions are welcome - code, docs, whatever it might be! If this is your first contribution to an Open Source project or you're a core maintainer of multiple projects, your time and interest in contributing to this project is most welcome. We appreciate every contribution and reward active contributors with special badges and shoutouts!

## 🌟 Why Contribute?

- **Improve Your Skills:** Work with a modern tech stack (Next.js, NestJS, Prisma).
- **Grow Your Portfolio:** Contributions to popular open-source projects look great on your resume.
- **Get Rewarded:** Active contributors get shoutouts, special badges on GitHub, and potential rewards!
- **Help the Community:** Make PostPilot better for thousands of creators and SaaS founders.



## Read the developers guide

The main documentation site has a [developer guide](https://coraxcolab.com/docs/developer-guide). That guide provides you a good understanding of the project structure, and how to setup your development environment. Read this document after you have read that guide. This document is intended to provide you a good understanding of how to submit your first contribution.

## Write code with others

This is an open source project, with an open and welcoming community that is always keen to welcome new contributors. We recommend the two best ways to interact with the community are:

- **GitHub issues**: To discuss more slowly, or longer-written messages.
- **[Discord chat](https://coraxcolab.com/discord)**: To chat with people and a quicker feedback.

As a general rule;

- **If a change is less than 3 lines**: You're probably safe just to submit the change without a discussion. This includes typos, dependency changes, and quick fixes, etc.
- **If a change is more than 3 lines**: It's probably best to discuss the change in an issue or on discord first. This is simply because you might not be aware of the roadmap for the project, or understand the impact this change might have. We're just trying to save you time here, and importantly, avoid you being disappointed if your change isn't accepted.

## Types of Contributions

Contributions can include:

- **New Social Integrations:** Adding new providers in `libraries/nestjs-libraries/src/integrations/social` or custom nodes for workflows.
- **Code improvements:** Fixing bugs, memory optimizations, UI enhancements in Next.js, or backend updates in NestJS.
- **Documentation updates:** Enhancing clarity, fixing typos, or adding missing information to `README.md` or the docs.
- **Feature requests:** Suggesting new capabilities, analytics improvements, or AI tools.
- **Bug reports:** Identifying and reporting issues.

## How to contribute

This project follows a Fork/Feature Branch/Pull Request model. Since we use `pnpm` workspaces, make sure your dev environment is correctly set up. If you're not familiar with this, here's how it works:

1. **Fork the project:** Create a personal copy of the repository on your GitHub account.
2. **Clone your fork:** Bring a copy of your fork to your local machine.
3. **Create a new branch**: Start a new branch for your changes
4. **Make your changes**: Implement the changes you wish to contribute. Make sure you install packages using `pnpm`. Run the frontend with `pnpm --filter apps/frontend run dev` and test your logic locally.
5. **Run tests & lint**: We have strict quality checks. Ensure your code compiles and passes testing.
6. **Push your changes**: Upload your changes to your fork.
7. **Create a pull request**: Propose your changes **to the main branch**.

# Need Help?

Again, do check the [developer guide](https://coraxcolab.com/docs/developer-guide). Much of what you probably need to know is in there.

If you encounter any issues, please visit our [support page](https://coraxcolab.com/docs/support) or check the community forums. Your contributions help make PostPilot better!
