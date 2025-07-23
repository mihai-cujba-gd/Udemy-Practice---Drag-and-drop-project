enum ProjectStatus {
    Active,
    Finished
}
class Project {
    constructor(
        public id: string,
        public title: string,
        public description: string,
        public people: number,
        public status: ProjectStatus) {

    }
}

type Listener = (projects: Project[]) => void;

class ProjectState {
    private readonly listeners: Listener[] = [];
    private readonly projects: Project[] = [];
    private static instance: ProjectState;

    private constructor() { }

    static getInstance() {
        if (this.instance) {
            return this.instance
        }

        this.instance = new ProjectState()

        return this.instance;
    }

    addListener(listenerFn: Listener) {
        this.listeners.push(listenerFn);
    }

    addProject(title: string, description: string, people: number) {
        const newProject = new Project(
            Math.random().toString(),
            title,
            description,
            people,
            ProjectStatus.Active
        )

        this.projects.push(newProject);

        for (const listenerFn of this.listeners) {
            listenerFn(this.projects.slice())
        }
    }

}

const projectState = ProjectState.getInstance();

interface Validatable {
    value?: string | number;
    required?: boolean;
    minLength?: number;
    maxLength?: number;
    min?: number;
    max?: number;
}

function validate(validatableInput: Validatable) {
    let isValid = true;

    const stringValue = validatableInput.value?.toString() || "";

    if (validatableInput.required) {
        isValid = isValid && stringValue.trim().length !== 0;
    }

    if (validatableInput.minLength != null && typeof validatableInput.value === 'string') {
        isValid = isValid && stringValue.length > validatableInput.minLength
    }

    if (validatableInput.maxLength != null && typeof validatableInput.value === 'string') {
        isValid = isValid && stringValue.length > validatableInput.maxLength
    }

    if (validatableInput.min != null && typeof validatableInput.value === "number") {
        isValid = isValid && validatableInput.value >= validatableInput.min
    }

    if (validatableInput.max != null && typeof validatableInput.value === "number") {
        isValid = isValid && validatableInput.value <= validatableInput.max
    }

    return isValid;
}

function autoBind(_target: any, _methodName: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    const adjDescriptor: PropertyDescriptor = {
        configurable: true,
        get() {
            const boundFn = originalMethod.bind(this);

            return boundFn;
        }
    }

    return adjDescriptor;
}

abstract class Component<T extends HTMLElement, U extends HTMLElement> {
    templateElement: HTMLTemplateElement;
    hostElement: T;
    element: U;

    constructor(templateId: string, hostElementId: string, insertAtStart: boolean, newElementId?: string) {
        this.templateElement = document.getElementById(templateId)! as HTMLTemplateElement;
        this.hostElement = document.getElementById(hostElementId)! as T;

        const importedNode = document.importNode(this.templateElement.content, true);
        this.element = importedNode.firstElementChild as U;

        if (newElementId) {
            this.element.id = newElementId;
        }

        this.attach(insertAtStart);
    }


    private attach(insertAtStart: boolean) {
        this.hostElement.insertAdjacentElement(insertAtStart ? 'afterbegin' : 'beforeend', this.element)
    }

    abstract configure(): void;

    abstract renderContent(): void;
}

class ProjectList extends Component<HTMLDivElement, HTMLElement> {
    assignedProjects: Project[];

    constructor(private readonly type: 'active' | 'finished') {
        super("project-list", "app", false, `${type}-projects`)

        this.assignedProjects = [];


        this.configure();
        this.renderContent()
    }

    private renderProjects() {
        const listId = `${this.type}-projects-list`;
        const listEl = document.getElementById(listId)! as HTMLUListElement;

        listEl.innerHTML = "";

        for (const project of this.assignedProjects) {
            const listItem = document.createElement("li");
            listItem.textContent = project.title;
            listEl.appendChild(listItem)
        }
    }

    configure(): void {
        projectState.addListener((projects) => {
            const relevantProjects = projects.filter(project => {
                if (this.type === "active") {
                    return project.status === ProjectStatus.Active
                }

                return project.status === ProjectStatus.Finished
            })
            this.assignedProjects = relevantProjects;
            this.renderProjects()
        })
    }

    renderContent() {
        const listId = `${this.type}-projects-list`;
        this.element.querySelector('ul')!.id = listId;
        this.element.querySelector("h2")!.textContent = this.type.toUpperCase() + " PROJECTS"
    }

}

class ProjectInput extends Component<HTMLDivElement, HTMLFormElement> {
    titleInputElement: HTMLInputElement;
    descriptionInputElement: HTMLInputElement;
    peopleInputElement: HTMLInputElement;

    constructor() {
        super("project-input", "app", true, "user-input")

        this.titleInputElement = this.element.querySelector("#title")!;
        this.descriptionInputElement = this.element.querySelector("#description")!;
        this.peopleInputElement = this.element.querySelector("#people")!;

        this.configure();
    }

    configure() {
        this.element.addEventListener("submit", this.submitHandler)
    }

    renderContent(): void { }

    private gatherUserInput(): [string, string, number] | void {
        const title = this.titleInputElement.value;
        const description = this.descriptionInputElement.value;
        const people = this.peopleInputElement.value;

        const titleValidation: Validatable = {
            value: title,
            required: true,
        }

        const descriptionValidation: Validatable = {
            value: description,
            required: true,
            minLength: 5,
        }

        const peopleValidation: Validatable = {
            value: +people,
            required: true,
            min: 1,
            max: 5,
        }

        if (!validate(titleValidation) || !validate(descriptionValidation) || !validate(peopleValidation)) {
            alert("Invalid input, please try again")
            return
        }


        return [title, description, +people];
    }

    private clearInputs() {
        this.titleInputElement.value = "";
        this.descriptionInputElement.value = "";
        this.peopleInputElement.value = "";
    }

    @autoBind
    private submitHandler(event: Event) {
        event.preventDefault();
        const userInput = this.gatherUserInput();

        if (Array.isArray(userInput)) {
            const [title, description, people] = userInput;

            projectState.addProject(title, description, people)

            this.clearInputs()
        }
    }

}

const projectInput = new ProjectInput();
const activeProjectList = new ProjectList("active");
const finishedProjectList = new ProjectList("finished");