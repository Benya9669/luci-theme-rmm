export function cursor() {
    return { get: function(config, section, option) {
        if (config != 'rmm-agent' || section != 'main') die('Unexpected UCI scope');
        if (option == null) return 'agent';
        let options = { enabled: '1', interval_seconds: '45', connectivity_check_interval_seconds: '600' };
        if (!(option in options)) die('Unexpected UCI option');
        return options[option];
    }};
};
