"use client";

import { type ComponentPropsWithRef, type ReactNode, type RefAttributes } from "react";
import {
    Bell01,
    Calendar,
    CheckCircle,
    Copy01,
    CreditCard01,
    File04,
    FilterLines,
    Image01,
    LayersTwo01,
    Link01,
    Mail01,
    MessageChatCircle,
    Paperclip,
    Receipt,
    SearchLg,
    Send01,
    Settings01,
    Sliders01,
    Stars02,
    Tag01,
    UploadCloud02,
    User01,
    Users01,
    XClose,
} from "@untitledui-pro/icons/line";
import type {
    DialogProps as AriaDialogProps,
    ModalOverlayProps as AriaModalOverlayProps,
    ModalRenderProps as AriaModalRenderProps,
} from "react-aria-components";
import { Dialog as AriaDialog, DialogTrigger as AriaDialogTrigger, Modal as AriaModal, ModalOverlay as AriaModalOverlay } from "react-aria-components";
import { Badge } from "@/components/base/badges/badges";
import { Button } from "@/components/base/buttons/button";
import { CloseButton } from "@/components/base/buttons/close-button";
import { Checkbox } from "@/components/base/checkbox/checkbox";
import { InputBase } from "@/components/base/input/input";
import { VisaIcon } from "@/components/foundations/payment-icons";
import { cx } from "@/utils/cx";
import { surfaceLevel, zRole } from "@/toolkit/layout-system/contract";

interface ModalOverlayProps extends AriaModalOverlayProps, RefAttributes<HTMLDivElement> {}

export const ModalOverlay = (props: ModalOverlayProps) => {
    return (
        <AriaModalOverlay
            {...props}
            data-uui-layer-root="modal"
            className={(state) =>
                cx(
                    "fixed inset-0 flex min-h-dvh w-full items-center justify-end bg-blanket/70 pl-6 outline-hidden ease-linear md:pl-10",
                    zRole.modal,
                    state.isEntering && "duration-300 animate-in fade-in",
                    state.isExiting && "duration-500 animate-out fade-out",
                    typeof props.className === "function" ? props.className(state) : props.className,
                )
            }
        />
    );
};
ModalOverlay.displayName = "ModalOverlay";

interface ModalProps extends AriaModalOverlayProps, RefAttributes<HTMLDivElement> {}

export const Modal = (props: ModalProps) => (
    <AriaModal
        {...props}
        className={(state) =>
            cx(
                "inset-y-0 right-0 h-full w-full max-w-100 transition",
                surfaceLevel.overlay,
                state.isEntering && "duration-300 animate-in slide-in-from-right",
                state.isExiting && "duration-500 animate-out slide-out-to-right",
                typeof props.className === "function" ? props.className(state) : props.className,
            )
        }
    />
);
Modal.displayName = "Modal";

interface DialogProps extends AriaDialogProps, RefAttributes<HTMLElement> {}

export const Dialog = (props: DialogProps) => (
    <AriaDialog
        role="dialog"
        aria-label="Slideout menu"
        {...props}
        className={cx("relative flex size-full flex-col items-start gap-6 overflow-y-auto bg-primary ring-1 ring-secondary_alt outline-hidden", props.className)}
    />
);
Dialog.displayName = "Dialog";

interface SlideoutMenuProps extends Omit<AriaModalOverlayProps, "children">, RefAttributes<HTMLDivElement> {
    children: ReactNode | ((children: AriaModalRenderProps & { close: () => void }) => ReactNode);
    dialogClassName?: string;
}

const Menu = ({ children, dialogClassName, ...props }: SlideoutMenuProps) => {
    return (
        <ModalOverlay {...props}>
            <Modal className={(state) => cx(typeof props.className === "function" ? props.className(state) : props.className)}>
                {(state) => (
                    <Dialog className={dialogClassName}>
                        {({ close }) => {
                            return typeof children === "function" ? children({ ...state, close }) : children;
                        }}
                    </Dialog>
                )}
            </Modal>
        </ModalOverlay>
    );
};
Menu.displayName = "SlideoutMenu";

const Content = ({ role = "main", ...props }: ComponentPropsWithRef<"div">) => {
    return <div role={role} {...props} className={cx("flex size-full flex-col gap-6 overflow-y-auto overscroll-auto px-4 md:px-6", props.className)} />;
};
Content.displayName = "SlideoutContent";

interface SlideoutHeaderProps extends ComponentPropsWithRef<"header"> {
    onClose?: () => void;
}

const Header = ({ className, children, onClose, ...props }: SlideoutHeaderProps) => {
    return (
        <header {...props} className={cx("relative w-full px-4 pt-6 md:px-6", zRole.local, className)}>
            {children}
            <CloseButton size="sm" className="absolute top-3 right-3 shrink-0" onClick={onClose} />
        </header>
    );
};
Header.displayName = "SlideoutHeader";

const Footer = (props: ComponentPropsWithRef<"footer">) => {
    return <footer {...props} className={cx("w-full p-4 shadow-[inset_0px_1px_0px_0px] shadow-border-secondary md:px-6", props.className)} />;
};
Footer.displayName = "SlideoutFooter";

const SlideoutMenu = Menu as typeof Menu & {
    Trigger: typeof AriaDialogTrigger;
    Content: typeof Content;
    Header: typeof Header;
    Footer: typeof Footer;
};
SlideoutMenu.displayName = "SlideoutMenu";

SlideoutMenu.Trigger = AriaDialogTrigger;
SlideoutMenu.Content = Content;
SlideoutMenu.Header = Header;
SlideoutMenu.Footer = Footer;

export { SlideoutMenu };

export type SlideoutPanelType =
    | "placeholder"
    | "messages"
    | "message-chat"
    | "user-profile"
    | "payment-method"
    | "payment-details"
    | "plan"
    | "filters"
    | "labels"
    | "project-details"
    | "team-members"
    | "file-upload"
    | "notification-checkboxes"
    | "notification-button-groups"
    | "notifications"
    | "order-summary"
    | "calendar-event"
    | "ai-assistant-intro"
    | "ai-assistant-message"
    | "user-settings";

export const slideoutPanelTypes: Array<{ type: SlideoutPanelType; label: string }> = [
    { type: "placeholder", label: "Basic panel" },
    { type: "messages", label: "Messages" },
    { type: "message-chat", label: "Message chat" },
    { type: "user-profile", label: "User profile" },
    { type: "payment-method", label: "Payment method" },
    { type: "payment-details", label: "Payment details" },
    { type: "plan", label: "Plan" },
    { type: "filters", label: "Filters" },
    { type: "labels", label: "Labels" },
    { type: "project-details", label: "Project details" },
    { type: "team-members", label: "Team members" },
    { type: "file-upload", label: "File upload" },
    { type: "notification-checkboxes", label: "Notification settings checkboxes" },
    { type: "notification-button-groups", label: "Notification settings button groups" },
    { type: "notifications", label: "Notifications" },
    { type: "order-summary", label: "Order summary" },
    { type: "calendar-event", label: "Calendar event" },
    { type: "ai-assistant-intro", label: "A.I. assistant intro" },
    { type: "ai-assistant-message", label: "A.I. assistant message" },
    { type: "user-settings", label: "User settings" },
];

const headerByType: Record<SlideoutPanelType, { title: string; description: string; icon: typeof Settings01; tabs?: string[] }> = {
    placeholder: { title: "Workspace settings", description: "Review profile, security, and notification preferences.", icon: Settings01, tabs: ["My details", "Profile", "Password"] },
    messages: { title: "Messages", description: "Review recent conversations and team inbox updates.", icon: MessageChatCircle, tabs: ["Recent", "Groups", "Archive"] },
    "message-chat": { title: "Group chat", description: "Coordinate project notes with the launch team.", icon: MessageChatCircle, tabs: ["Recent", "Groups", "Archive"] },
    "user-profile": { title: "Freelancer", description: "Manage the freelancer profile.", icon: User01 },
    "payment-method": { title: "Payment method", description: "Select your default payment method.", icon: CreditCard01 },
    "payment-details": { title: "Payment details", description: "Update your card and billing info.", icon: CreditCard01 },
    plan: { title: "Change your plan", description: "Flexible pricing that grows with you.", icon: LayersTwo01 },
    filters: { title: "Filters", description: "Narrow results by role and team.", icon: FilterLines },
    labels: { title: "Add labels to project", description: "Labels help organize projects.", icon: Tag01 },
    "project-details": { title: "Marketing site redesign", description: "Redesign of untitledui.com", icon: Sliders01 },
    "team-members": { title: "Team members", description: "Invite or manage people on this project.", icon: Users01 },
    "file-upload": { title: "Upload and attach files", description: "Upload files and attach them to this project.", icon: UploadCloud02 },
    "notification-checkboxes": { title: "Notifications", description: "Manage notification preferences.", icon: Bell01 },
    "notification-button-groups": { title: "Notifications", description: "Manage notification preferences.", icon: Bell01 },
    notifications: { title: "Notifications", description: "You have 12 unread notifications.", icon: Bell01 },
    "order-summary": { title: "Order summary", description: "Review your subscription checkout.", icon: Receipt },
    "calendar-event": { title: "Product demo", description: "Review the new product workflow.", icon: Calendar },
    "ai-assistant-intro": { title: "Hi Olivia,", description: "Welcome back! How can I help?", icon: Stars02 },
    "ai-assistant-message": { title: "Welcome back! How can I help?", description: "Ask me anything about this workspace.", icon: Stars02 },
    "user-settings": { title: "User settings", description: "Manage account and workspace details.", icon: Settings01 },
};

const people = [
    { name: "Olivia Rhye", role: "Product Designer", initials: "OR", online: true },
    { name: "Lana Steiner", role: "UX Researcher", initials: "LS", online: true },
    { name: "Candice Wu", role: "Frontend Developer", initials: "CW", online: false },
    { name: "Drew Cano", role: "Product Manager", initials: "DC", online: true },
    { name: "Phoenix Baker", role: "Backend Developer", initials: "PB", online: false },
];

const labels = [
    { text: "Design", color: "purple" },
    { text: "Product", color: "blue" },
    { text: "Marketing", color: "brand" },
    { text: "Management", color: "pink" },
    { text: "Sales", color: "success" },
    { text: "Operations", color: "sky" },
] as const;

export interface SlideoutPanelProps extends ComponentPropsWithRef<"aside"> {
    type?: SlideoutPanelType;
    showTabs?: boolean;
    previewHeightClassName?: string;
}

export function SlideoutPanel({ type = "placeholder", showTabs, previewHeightClassName = "h-[720px]", className, ...props }: SlideoutPanelProps) {
    const header = headerByType[type];
    return (
        <aside
            {...props}
            className={cx("flex w-full max-w-[440px] flex-col overflow-hidden rounded-xl border border-secondary bg-primary shadow-lg", previewHeightClassName, className)}
        >
            <PanelHeader title={header.title} description={header.description} icon={header.icon} tabs={showTabs ? header.tabs : undefined} />
            <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4 md:px-6">
                <PanelBody type={type} />
            </div>
            <PanelFooter type={type} />
        </aside>
    );
}

function PanelHeader({
    title,
    description,
    icon: Icon,
    tabs,
}: {
    title: string;
    description: string;
    icon: typeof Settings01;
    tabs?: string[];
}) {
    return (
        <header className="shrink-0 px-4 pt-5 pb-4 md:px-6">
            <div className="flex items-start gap-3">
                <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-primary text-fg-secondary shadow-xs ring-1 ring-primary">
                    <Icon className="size-5" aria-hidden="true" />
                </span>
                <div className="min-w-0 flex-1">
                    <h3 className="truncate text-md font-semibold text-primary">{title}</h3>
                    <p className="mt-0.5 text-sm text-tertiary">{description}</p>
                </div>
                <button
                    type="button"
                    className="grid size-8 shrink-0 place-items-center rounded-lg text-fg-quaternary outline-brand hover:bg-secondary focus-visible:outline-2 focus-visible:outline-offset-2"
                    aria-label="Close slideout menu"
                >
                    <XClose className="size-5" aria-hidden="true" />
                </button>
            </div>
            {tabs && (
                <div className="mt-5 grid grid-cols-3 rounded-lg bg-secondary p-1 ring-1 ring-secondary">
                    {tabs.map((tab, index) => (
                        <button
                            key={tab}
                            type="button"
                            aria-pressed={index === 0}
                            className={cx(
                                "rounded-md px-2 py-1.5 text-sm font-semibold text-tertiary outline-brand focus-visible:outline-2 focus-visible:outline-offset-2",
                                index === 0 && "bg-primary text-secondary shadow-xs",
                            )}
                        >
                            {tab}
                        </button>
                    ))}
                </div>
            )}
        </header>
    );
}

function PanelFooter({ type }: { type: SlideoutPanelType }) {
    const primary = type === "file-upload" ? "Attach to project" : type === "filters" || type === "labels" ? "Apply" : type === "order-summary" ? "Continue to checkout" : "Save";
    return (
        <footer className="flex shrink-0 items-center justify-between gap-3 border-t border-secondary px-4 py-4 md:px-6">
            <Button color="link-color" size="sm" className={cx(!["filters", "labels"].includes(type) && "invisible")}>
                Save filter
            </Button>
            <div className="flex gap-3">
                <Button color="secondary" size="sm">
                    Cancel
                </Button>
                <Button color="primary" size="sm">
                    {primary}
                </Button>
            </div>
        </footer>
    );
}

function PanelBody({ type }: { type: SlideoutPanelType }) {
    if (type === "messages") return <MessagesContent />;
    if (type === "message-chat") return <MessageChatContent />;
    if (type === "user-profile") return <UserProfileContent />;
    if (type === "payment-method") return <PaymentMethodContent />;
    if (type === "payment-details") return <PaymentDetailsContent />;
    if (type === "plan") return <PlanContent />;
    if (type === "filters") return <FiltersContent />;
    if (type === "labels") return <LabelsContent />;
    if (type === "project-details") return <ProjectDetailsContent />;
    if (type === "team-members") return <TeamMembersContent />;
    if (type === "file-upload") return <FileUploadContent />;
    if (type === "notification-checkboxes") return <NotificationCheckboxContent />;
    if (type === "notification-button-groups") return <NotificationButtonGroupContent />;
    if (type === "notifications") return <NotificationsContent />;
    if (type === "order-summary") return <OrderSummaryContent />;
    if (type === "calendar-event") return <CalendarEventContent />;
    if (type === "ai-assistant-intro") return <AiIntroContent />;
    if (type === "ai-assistant-message") return <AiMessageContent />;
    if (type === "user-settings") return <UserSettingsContent />;
    return <PlaceholderContent />;
}

function PlaceholderContent() {
    const sections = [
        { label: "Account owner", text: "Olivia Rhye controls billing, workspace access, and compliance exports." },
        { label: "Security", text: "Two-factor authentication is enabled and password rotation is due next quarter." },
        { label: "Notifications", text: "Weekly summaries are sent every Monday with product and support highlights." },
    ];

    return (
        <div className="space-y-5">
            {sections.map((section) => (
                <div key={section.label} className="space-y-2">
                    <p className="text-sm font-semibold text-secondary">{section.label}</p>
                    <p className="text-sm text-tertiary">{section.text}</p>
                    <div className="h-16 rounded-lg bg-secondary" />
                </div>
            ))}
        </div>
    );
}

function PersonRow({ person = people[0], action }: { person?: (typeof people)[number]; action?: ReactNode }) {
    return (
        <div className="flex items-center gap-3 rounded-lg border border-secondary bg-primary p-3 shadow-xs">
            <AvatarInitials initials={person.initials} online={person.online} />
            <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-secondary">{person.name}</p>
                <p className="truncate text-sm text-tertiary">{person.role}</p>
            </div>
            {action}
        </div>
    );
}

function AvatarInitials({ initials, online }: { initials: string; online?: boolean }) {
    return (
        <span className="relative grid size-10 shrink-0 place-items-center rounded-full bg-brand-secondary text-sm font-semibold text-brand-secondary">
            {initials}
            {online && <span className="absolute right-0 bottom-0 size-3 rounded-full border-2 border-primary bg-success-solid" />}
        </span>
    );
}

function MessagesContent() {
    return (
        <div className="space-y-3">
            {people.map((person, index) => (
                <PersonRow
                    key={person.name}
                    person={person}
                    action={<span className={cx("size-2 rounded-full", index < 3 ? "bg-success-solid" : "bg-disabled")} aria-hidden="true" />}
                />
            ))}
        </div>
    );
}

function MessageChatContent() {
    return (
        <div className="flex min-h-full flex-col">
            <div className="space-y-4">
                <ChatBubble person={people[0]} text="Hey team, I've finished with the requirements doc." />
                <ChatBubble person={people[2]} text="Looks good. I left notes on the billing section." align="end" />
                <ChatBubble person={people[1]} text="Awesome, thanks. I'll review it next." />
            </div>
            <div className="mt-auto pt-4">
                <div className="flex items-center gap-2 rounded-lg border border-secondary bg-primary px-3 py-2 shadow-xs">
                    <input className="min-w-0 flex-1 bg-transparent text-sm text-primary outline-none placeholder:text-placeholder" placeholder="Message" />
                    <Paperclip className="size-4 text-fg-quaternary" aria-hidden="true" />
                    <Send01 className="size-4 text-fg-brand-primary" aria-hidden="true" />
                </div>
            </div>
        </div>
    );
}

function ChatBubble({ person, text, align = "start" }: { person: (typeof people)[number]; text: string; align?: "start" | "end" }) {
    return (
        <div className={cx("flex gap-2", align === "end" && "justify-end")}>
            {align === "start" && <AvatarInitials initials={person.initials} online={person.online} />}
            <div className={cx("max-w-[78%] rounded-lg px-3 py-2 text-sm", align === "end" ? "bg-brand-solid text-white" : "bg-secondary text-secondary")}>{text}</div>
        </div>
    );
}

function UserProfileContent() {
    return (
        <div className="space-y-5">
            <div className="h-24 rounded-xl bg-brand-section" />
            <div className="-mt-12 flex items-end gap-4 px-4">
                <AvatarInitials initials="OR" online />
                <div className="min-w-0 pb-1">
                    <p className="text-md font-semibold text-primary">Olivia Rhye</p>
                    <p className="text-sm text-tertiary">@olivia</p>
                </div>
            </div>
            <div className="grid grid-cols-3 rounded-lg border border-secondary bg-primary text-center">
                {["4.9 rating", "120 jobs", "98% success"].map((stat) => (
                    <div key={stat} className="border-r border-secondary px-2 py-3 last:border-r-0">
                        <p className="text-sm font-semibold text-primary">{stat.split(" ")[0]}</p>
                        <p className="text-xs text-tertiary">{stat.substring(stat.indexOf(" ") + 1)}</p>
                    </div>
                ))}
            </div>
            <Field label="Email" value="olivia@untitledui.com" icon={Mail01} />
            <Field label="Role" value="Product Designer" />
            <Field label="Country" value="Australia" />
        </div>
    );
}

function Field({ label, value, icon: Icon }: { label: string; value: string; icon?: typeof Mail01 }) {
    return (
        <div className="space-y-1.5">
            <p className="text-sm font-medium text-secondary">{label}</p>
            <div className="flex items-center gap-2 rounded-lg border border-secondary bg-primary px-3 py-2 text-sm text-primary shadow-xs">
                {Icon && <Icon className="size-4 text-fg-quaternary" aria-hidden="true" />}
                <span className="truncate">{value}</span>
            </div>
        </div>
    );
}

function PaymentMethodContent() {
    return (
        <div className="space-y-3">
            {["Visa ending in 1234", "Mastercard ending in 5678", "Bank transfer ending in 9012"].map((label, index) => (
                <div key={label} className={cx("rounded-xl border p-4", index === 0 ? "border-brand bg-brand-secondary_alt" : "border-secondary bg-primary")}>
                    <div className="flex items-center gap-3">
                        <span className="grid h-9 w-12 place-items-center rounded-md border border-secondary bg-primary">
                            <VisaIcon className="h-3 w-auto" />
                        </span>
                        <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold text-secondary">{label}</p>
                            <p className="text-sm text-tertiary">Expiry 06/2025</p>
                        </div>
                        {index === 0 && <CheckCircle className="size-5 text-fg-brand-primary" aria-hidden="true" />}
                    </div>
                </div>
            ))}
        </div>
    );
}

function PaymentDetailsContent() {
    return (
        <div className="space-y-4">
            <div className="rounded-xl bg-brand-solid p-5 text-white shadow-lg">
                <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold">Untitled Card</p>
                    <span className="rounded bg-primary px-2 py-1 text-xs font-bold text-secondary ring-1 ring-secondary">VISA</span>
                </div>
                <p className="mt-12 text-lg font-semibold tracking-normal">1234 1234 1234 1234</p>
                <div className="mt-4 flex justify-between text-xs">
                    <span>Olivia Rhye</span>
                    <span>06 / 2028</span>
                </div>
            </div>
            <Field label="Name on card" value="Olivia Rhye" />
            <Field label="Card number" value="1234 1234 1234 1234" />
            <div className="grid grid-cols-2 gap-3">
                <Field label="Expiry" value="06 / 2028" />
                <Field label="CVV" value="123" />
            </div>
            <Field label="Billing email" value="billing@untitledui.com" icon={Mail01} />
        </div>
    );
}

function PlanContent() {
    return (
        <div className="space-y-3">
            {[
                ["Basic plan", "$10", "Includes up to 10 users."],
                ["Business plan", "$20", "Includes up to 20 users."],
                ["Enterprise plan", "$40", "Unlimited users, unlimited data."],
            ].map(([title, price, description], index) => (
                <div key={title} className={cx("rounded-xl border p-4", index === 0 ? "border-brand bg-brand-secondary_alt" : "border-secondary bg-primary")}>
                    <div className="flex items-start justify-between gap-3">
                        <div>
                            <p className="text-sm font-semibold text-secondary">{title}</p>
                            <p className="mt-3 text-display-xs font-semibold tracking-normal text-primary">
                                {price} <span className="text-sm font-medium text-tertiary">per month</span>
                            </p>
                            <p className="mt-1 text-sm text-tertiary">{description}</p>
                        </div>
                        {index === 0 && <CheckCircle className="size-5 shrink-0 text-fg-brand-primary" aria-hidden="true" />}
                    </div>
                </div>
            ))}
        </div>
    );
}

function FiltersContent() {
    const roles = ["Backend Developer", "Frontend Developer", "Fullstack Developer", "Product Designer", "Product Manager", "QA Engineer", "UX Copywriter", "UX Designer"];
    return (
        <div className="space-y-5">
            <InputBase size="sm" icon={SearchLg} placeholder="Search" shortcut="⌘K" />
            <div className="space-y-3">
                {roles.map((role) => (
                    <Checkbox key={role} label={role} size="sm" />
                ))}
            </div>
            <Button color="link-color" size="sm">
                Show 10 more
            </Button>
        </div>
    );
}

function LabelsContent() {
    return (
        <div className="space-y-5">
            <InputBase size="sm" icon={SearchLg} placeholder="Search for label" shortcut="⌘K" />
            <div className="space-y-3">
                <p className="text-sm font-semibold text-secondary">Custom labels</p>
                {labels.map((label, index) => (
                    <div key={`${label.text}-${index}`} className="flex items-center gap-3">
                        <Checkbox size="sm" isSelected={index < 4} aria-label={label.text} />
                        <Badge size="sm" color={label.color}>
                            {label.text}
                        </Badge>
                    </div>
                ))}
            </div>
        </div>
    );
}

function ProjectDetailsContent() {
    return (
        <div className="space-y-4">
            <div className="space-y-2">
                <p className="text-sm font-semibold text-secondary">Share project</p>
                <div className="flex items-center gap-2 text-sm text-tertiary">
                    <Link01 className="size-4" aria-hidden="true" />
                    untitledui.com/project/marketing-site
                </div>
                <Button color="secondary" size="sm" iconLeading={Copy01}>
                    Copy link
                </Button>
            </div>
            <Field label="Name of project *" value="Marketing site redesign" />
            <div className="space-y-1.5">
                <p className="text-sm font-medium text-secondary">Description</p>
                <textarea
                    className="min-h-24 w-full resize-none rounded-lg border border-secondary bg-primary px-3 py-2 text-sm text-primary shadow-xs outline-brand placeholder:text-placeholder focus-visible:outline-2 focus-visible:outline-offset-2"
                    defaultValue="A little about the company and the team that you'll be working with."
                />
            </div>
            <Field label="Project status" value="In progress" />
            <TeamMiniList />
        </div>
    );
}

function TeamMembersContent() {
    return (
        <div className="space-y-4">
            <InputBase size="sm" icon={SearchLg} placeholder="Search" />
            <TeamMiniList />
            <div className="space-y-2">
                <p className="text-sm font-semibold text-secondary">Pending invites</p>
                <PersonRow person={{ name: "Molly Holmes", role: "Invited", initials: "MH", online: false }} />
            </div>
            <Button color="link-color" size="sm">
                See more
            </Button>
        </div>
    );
}

function TeamMiniList() {
    return (
        <div className="space-y-2">
            {people.slice(0, 4).map((person) => (
                <PersonRow key={person.name} person={person} action={<Checkbox aria-label={`Select ${person.name}`} size="sm" />} />
            ))}
        </div>
    );
}

function FileUploadContent() {
    return (
        <div className="space-y-4">
            <div className="rounded-xl border border-brand bg-brand-secondary_alt p-4 text-center">
                <span className="mx-auto grid size-10 place-items-center rounded-lg bg-primary text-fg-brand-primary shadow-xs ring-1 ring-secondary">
                    <UploadCloud02 className="size-5" aria-hidden="true" />
                </span>
                <p className="mt-3 text-sm font-semibold text-secondary">Click to upload or drag and drop</p>
                <p className="text-xs text-tertiary">SVG, PNG, JPG or GIF (max. 800x400px)</p>
            </div>
            {[
                { name: "Tech design requirements.pdf", size: "200 KB", Icon: File04 },
                { name: "Dashboard prototype.fig", size: "1.2 MB", Icon: Image01 },
                { name: "Contract summary.pdf", size: "320 KB", Icon: File04 },
            ].map(({ name, size, Icon }) => (
                <div key={name} className="flex items-center gap-3 rounded-lg border border-secondary bg-primary p-3">
                    <Icon className="size-8 shrink-0 text-fg-quaternary" aria-hidden="true" />
                    <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-secondary">{name}</p>
                        <p className="text-sm text-tertiary">{size}</p>
                    </div>
                    <CheckCircle className="size-5 text-success-primary" aria-hidden="true" />
                </div>
            ))}
        </div>
    );
}

function NotificationCheckboxContent() {
    const groups = ["New project updates", "New messages", "Team mentions", "Email notifications", "Slack notifications"];
    return (
        <div className="space-y-5">
            <p className="text-sm text-tertiary">Choose which notifications you want to receive.</p>
            <div className="space-y-3">
                {groups.map((group, index) => (
                    <Checkbox key={group} label={group} hint="Instant, daily digest, or none." size="md" isSelected={index < 3} />
                ))}
            </div>
        </div>
    );
}

function NotificationButtonGroupContent() {
    const rows = ["New projects", "Message replies", "Team mentions", "Email notifications", "Slack notifications"];
    return (
        <div className="space-y-4">
            {rows.map((row, index) => (
                <div key={row} className="rounded-lg border border-secondary p-3">
                    <p className="text-sm font-semibold text-secondary">{row}</p>
                    <div className="mt-3 grid grid-cols-3 rounded-lg bg-secondary p-1 ring-1 ring-secondary">
                        {["Off", "Daily", "Instant"].map((item, itemIndex) => (
                            <button
                                key={item}
                                type="button"
                                className={cx("rounded-md px-2 py-1.5 text-xs font-semibold text-tertiary", itemIndex === index % 3 && "bg-primary text-secondary shadow-xs")}
                            >
                                {item}
                            </button>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
}

function NotificationsContent() {
    return (
        <div className="space-y-3">
            {people.concat(people.slice(0, 3)).map((person, index) => (
                <div key={`${person.name}-${index}`} className="flex gap-3 rounded-lg p-2 hover:bg-secondary">
                    <AvatarInitials initials={person.initials} online={person.online} />
                    <div className="min-w-0 flex-1">
                        <p className="text-sm text-secondary">
                            <span className="font-semibold">{person.name}</span> mentioned you in Marketing site redesign.
                        </p>
                        <p className="mt-1 text-xs text-tertiary">{index + 1}h ago</p>
                    </div>
                    {index < 4 && <span className="mt-2 size-2 rounded-full bg-success-solid" />}
                </div>
            ))}
        </div>
    );
}

function OrderSummaryContent() {
    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <p className="text-md font-semibold text-primary">Total</p>
                <p className="text-md font-semibold text-primary">$49.00</p>
            </div>
            <Field label="Billing method" value="Exp. 06/2028 - Visa" />
            <Field label="Promo code" value="TEAM2026" />
            <div className="space-y-2 rounded-lg bg-secondary p-4">
                <SummaryRow label="Subtotal" value="$49.00" />
                <SummaryRow label="Tax" value="$0.00" />
                <SummaryRow label="Discount" value="-$10.00" />
                <SummaryRow label="Total" value="$39.00" strong />
            </div>
        </div>
    );
}

function SummaryRow({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
    return (
        <div className={cx("flex justify-between text-sm", strong ? "font-semibold text-primary" : "text-tertiary")}>
            <span>{label}</span>
            <span>{value}</span>
        </div>
    );
}

function CalendarEventContent() {
    return (
        <div className="space-y-4">
            <div className="rounded-xl bg-secondary p-4">
                <p className="text-sm font-semibold text-secondary">Product demo</p>
                <p className="mt-1 text-sm text-tertiary">Tuesday, 10:00 AM - 11:00 AM</p>
            </div>
            <TeamMiniList />
            <Field label="Location" value="Zoom meeting" />
            <div className="space-y-2">
                <p className="text-sm font-semibold text-secondary">Description</p>
                <p className="text-sm text-tertiary">Discuss the new dashboard flow and handoff feedback.</p>
            </div>
        </div>
    );
}

function AiIntroContent() {
    return (
        <div className="flex min-h-full flex-col items-center justify-center text-center">
            <span className="grid size-12 place-items-center rounded-full bg-brand-secondary text-fg-brand-primary">
                <Stars02 className="size-6" aria-hidden="true" />
            </span>
            <h4 className="mt-4 text-md font-semibold text-primary">Hi Olivia,</h4>
            <p className="mt-1 max-w-xs text-sm text-tertiary">Welcome back. How can I help with your project today?</p>
            <div className="mt-5 grid w-full gap-2">
                {["Write a project brief", "Summarize this week's work", "Draft a status update"].map((item) => (
                    <button key={item} type="button" className="rounded-lg border border-secondary bg-primary px-3 py-2 text-left text-sm font-medium text-secondary shadow-xs">
                        {item}
                    </button>
                ))}
            </div>
        </div>
    );
}

function AiMessageContent() {
    return (
        <div className="flex min-h-full flex-col">
            <div className="space-y-4">
                <div className="rounded-xl bg-secondary p-4 text-sm text-secondary">I've got a quick meeting with Sarah tomorrow at 10am. Can you draft a brief?</div>
                <div className="rounded-xl border border-secondary bg-primary p-4 text-sm text-secondary shadow-xs">
                    Sure. Here's a brief summary with goals, attendees, and next steps.
                </div>
                <div className="flex items-center gap-1 rounded-lg bg-brand-secondary_alt p-3 text-fg-brand-primary">
                    {[5, 8, 14, 20, 12, 6, 18, 10, 5].map((height, index) => (
                        <span key={index} className="w-1 rounded-full bg-brand-solid" style={{ height }} />
                    ))}
                </div>
            </div>
            <div className="mt-auto pt-4">
                <InputBase size="sm" placeholder="Ask me anything..." />
            </div>
        </div>
    );
}

function UserSettingsContent() {
    return (
        <div className="space-y-4">
            <UserProfileContent />
            <Field label="Company" value="Untitled UI" />
            <Field label="Workspace" value="Design system" />
        </div>
    );
}
