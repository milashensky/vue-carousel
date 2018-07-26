window.addEventListener("load",function(event) {
    Vue.component('carousel', {
        props: [
            'slidesPerScreenTablet', 'slidesPerScreenDesktop', 'slidesPerScreenBigScreen', 'slidesPerScreenMobile', 'slidesPerScreen',
            'autoWheeler', 'useChevrones', 'useDotControls', 'autoScroll', 'autoScrollInterval',
            'leftControlIcon', 'rightControlIcon', 'leftControlClass', 'rightControlClass', 'dotsClass', 'viewportClass'],
        template: `
        <div class="vue-carousel">
            <div class="carousel-wrapper">
                <left-control v-if="_useSideControls" class="carousel-conrtol" :icon="leftControlIcon" :ad-class="leftControlClass"></left-control>
                <div class="slides-viewport" :class="viewportClass">
                    <div class="slides-wrapper" @mousedown="dragStart">
                        <slot></slot>
                    </div>
                </div>
                <right-control v-if="_useSideControls" class="carousel-conrtol" :icon="rightControlIcon" :ad-class="rightControlClass"></right-control>
            </div>
            <div class="dots-control" v-if="_useDotControls">
                <span class="carousel-dot" :class="(screen == curScreen ? 'active ' + dotsClass: dotsClass)" @click="setScreen(screen)" v-for="screen in screensTotal"></span>
            </div>
        </div>
        `,
        data: function(){
            return {
                slots: [],
                draging: false,
                startX: 0,
                positionX: 0,
                dragTimeout: '',
                dragPosition: 0,
                viewportWidth: 0,
                wrapperWidth: 0,
                wrapper: {},
                slideWidth: 0,
                screensTotal: 0,
                curScreen: 1,
                scrollInterval: {},
                _slidesPerScreen: 2,
                _useSideControls: true,
                _useDotControls: true,
                _autoWheeler: true,
                _autoScroll: true,
                _autoScrollInterval: 5000,
            }
        },
        created: function () {
            let vm = this;
            vm._autoWheeler = (vm.autoWheeler != 'false');
            vm._useDotControls = (vm.useDotControls != 'false');
            vm._useSideControls = (vm.useChevrones != 'false');
            vm._autoScroll = (vm.autoScroll != 'false');
            vm._autoScrollInterval = vm.autoScrollInterval || 5000;
            vm.$on('scroll-left', function(e){
                if (vm.curScreen > 1)
                    vm.curScreen--
            })
            vm.$on('scroll-right', function(e){
                if (vm.curScreen < vm.screensTotal)
                    vm.curScreen++
            })
            for (let i = 0, slot; slot = vm.$slots.default[i]; i++){
                if (slot && slot.tag && slot.tag.indexOf('vue-component') == 0 && slot.tag.indexOf('slide') > 0) {
                    vm.slots.push(slot)
                }
            }

            document.addEventListener('mouseup', this.dragEnd)
            document.addEventListener('mousemove', this.drag)
            window.addEventListener('resize', function(){
                vm.initConteiner();
            });
            vm.initConteiner();
        },
        methods: {
            initConteiner: function(){
                vm = this;
                vm._slidesPerScreen = vm.slidesPerScreen || 2;
                if (vm.slidesPerScreenMobile && window.innerWidth < 576)
                    vm._slidesPerScreen = vm.slidesPerScreenMobile
                if (vm.slidesPerScreenTablet && window.innerWidth >= 576 && window.innerWidth < 992)
                    vm._slidesPerScreen = vm.slidesPerScreenTablet
                if (vm.slidesPerScreenDesktop && window.innerWidth >= 992 && window.innerWidth < 1200)
                    vm._slidesPerScreen = vm.slidesPerScreenDesktop
                if (vm.slidesPerScreenBigScreen && window.innerWidth >= 1200)
                    vm._slidesPerScreen = vm.slidesPerScreenBigScreen
                if (vm._slidesPerScreen > vm.slots.length) {
                    vm._slidesPerScreen = vm.slots.length;
                }
                vm.curScreen = 0
                setTimeout(function () {
                    vm.viewportWidth = vm.$el.querySelector('.slides-viewport').clientWidth;
                    vm.slideWidth = vm.viewportWidth / vm._slidesPerScreen;
                    for (let i = 0, slot; slot = vm.slots[i]; i++){
                        slot.elm.style.width =  vm.slideWidth + 'px';
                    }
                    vm.wrapper = vm.$el.querySelector('.slides-wrapper');
                    if (vm.slots.length) {
                        // vm.slideWidth = vm.slots[0].elm.clientWidth;
                        vm.wrapperWidth = vm.$el.querySelector('.slides-wrapper').scrollWidth;
                        vm.screensTotal = Math.ceil(vm.slots.length / vm._slidesPerScreen);
                    }
                    vm.curScreen = 1
                    vm.resetScrollInterval();
                }, 10);
            },
            resetScrollInterval: function(){
                let vm = this;
                clearInterval(vm.scrollInterval);
                if (vm._autoScroll){
                    vm.scrollInterval = setInterval(function () {
                        if (vm.curScreen < vm.screensTotal)
                            vm.curScreen++
                        else
                            vm.curScreen = 1
                    }, vm._autoScrollInterval);
                }
            },
            drag: function(e){
                let vm = this;
                if (vm.draging && e.screenX > 0) {
                    let max = vm.viewportWidth - vm.wrapperWidth;
                    vm.dragPosition = e.screenX - vm.startX + vm.positionX;
                    if (vm.dragPosition > 0){
                        vm.dragPosition /= 10;
                        return true
                    }
                    if (vm.dragPosition < max)
                        vm.dragPosition = max + (vm.dragPosition - max) / 10
                }
                return true
            },
            dragStart: function(e){
                let vm = this;
                clearInterval(vm.scrollInterval);
                vm.wrapper.style.transition = 'none';
                vm.startX = e.screenX;
                vm.draging = true;
            },
            dragEnd: function(e){
                let vm = this;
                vm.resetScrollInterval();
                if (vm.draging) {
                    vm.wrapper.style.transition = 'transform 0.5s ease';
                    vm.draging = false;
                    if (vm.dragPosition > 0){
                        vm.dragPosition = 0;
                        vm.curScreen = 1;
                    } else {
                        let max = vm.viewportWidth - vm.wrapperWidth;
                        if (vm.dragPosition < max) {
                            vm.dragPosition = max;
                            vm.curScreen = vm.screensTotal;
                        }
                        else if (vm._autoWheeler){
                            if (vm.dragPosition > vm.positionX) {
                                vm.curScreen = Math.floor(-vm.dragPosition / vm.slideWidth / vm._slidesPerScreen) + 1;
                            }
                            if (vm.dragPosition < vm.positionX){
                                vm.curScreen = Math.ceil(-vm.dragPosition / vm.slideWidth / vm._slidesPerScreen) + 1;
                            }
                        }
                    }
                    vm.positionX = vm.dragPosition;
                }
            },
            setScreen: function(screen) {
                this.curScreen = screen;
                clearInterval(vm.scrollInterval)
                if (vm._autoScroll){
                    vm.scrollInterval = setInterval(function () {
                        if (vm.curScreen < vm.screensTotal)
                            vm.curScreen++
                        else
                            vm.curScreen = 1
                    }, vm._autoScrollInterval);
                }
            }
        },
        watch: {
            dragPosition: function(val, old){
                if (val != undefined && val != old)
                    this.wrapper.style.transform = 'translate3d(' + val + 'px, 0px, 0px)';
            },
            curScreen: function(val, old){
                let vm = this
                if (val != undefined){
                    let screen = val - 1, position = 0;
                    if (screen < 0)
                        screen = 0
                    position = - (screen * vm._slidesPerScreen * vm.slideWidth)
                    let max = vm.viewportWidth - vm.wrapperWidth;
                    if (position < max)
                        position = max;
                    vm.dragPosition = position
                    vm.positionX = vm.dragPosition;
                    // vm.draging = true
                    // vm.dragEnd()
                }
            }
        },
        components: {
            leftControl: {
                props: ['icon', 'adClass'],
                template: `
                <div>
                    <a @click="scroll" :class="(adClass? adClass: 'btn-left')">
                        <template v-if="!icon">&lsaquo;</template>
                        <span v-if="icon" v-html="icon"></span>
                    </a>
                </div>
                `,
                methods: {
                    scroll: function(){
                        this.$parent.$emit('scroll-left', {a: 1})
                    }
                }
            },
            rightControl: {
                props: ['icon', 'adClass'],
                template: `
                <div>
                    <a @click="scroll" :class="(adClass? adClass: 'btn-right')">
                        <template v-if="!icon">&rsaquo;</template>
                        <span v-if="icon" v-html="icon"></span>
                    </a>
                </div>
                `,
                methods: {
                    scroll: function(){
                        this.$parent.$emit('scroll-right')
                    }
                }
            }
        }
    })
    Vue.component('slide', {
        template: `
            <div class="slide">
                <div class="slide-container">
                    <slot></slot>
                </div>
            </div>
        `,
        data: function() {
            return {
            }
        },
    })

    new Vue({
        el: '#carousel',
    })

}, false);
